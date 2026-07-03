// core.mjs — HTTP helpers + the self-learning backend router.
//
// Every channel call goes through runChannel(): backends are tried in LEARNED
// order (success-rate from past runs, persisted in ~/.jangkau/memory.json),
// every attempt is logged WITH its outcome to ~/.jangkau/learn.jsonl, and a
// small epsilon keeps exploring recovered backends so a fixed backend can win
// its spot back. This is the piece Agent-Reach doesn't have: the router
// remembers what worked on YOUR machine/network and adapts.
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const HOME = join(homedir(), ".jangkau");
const MEM_PATH = join(HOME, "memory.json");
const LOG_PATH = join(HOME, "learn.jsonl");
const EPSILON = 0.1; // 1-in-10 runs probe the static (documented) order instead of the learned one

function ensureHome() { if (!existsSync(HOME)) mkdirSync(HOME, { recursive: true }); }

export function loadMemory() {
  try { return JSON.parse(readFileSync(MEM_PATH, "utf8")); } catch { return { channels: {} }; }
}

function saveMemory(mem) {
  ensureHome();
  // temp+rename: a crash mid-write must never corrupt the learned memory
  const tmp = MEM_PATH + ".tmp";
  writeFileSync(tmp, JSON.stringify(mem, null, 2));
  renameSync(tmp, MEM_PATH);
}

export function logTrajectory(rec) {
  try { ensureHome(); appendFileSync(LOG_PATH, JSON.stringify({ at: new Date().toISOString(), ...rec }) + "\n"); } catch {}
}

function recordOutcome(channel, backend, ok, ms, err) {
  const mem = loadMemory();
  const c = (mem.channels[channel] ||= {});
  const b = (c[backend] ||= { ok: 0, fail: 0 });
  if (ok) { b.ok++; b.lastOk = new Date().toISOString(); }
  else { b.fail++; b.lastFail = new Date().toISOString(); b.lastErr = String(err).slice(0, 160); }
  saveMemory(mem);
  logTrajectory({ channel, backend, ok, ms, ...(ok ? {} : { err: String(err).slice(0, 160) }) });
}

// Laplace-smoothed success rate so 1 lucky hit doesn't beat 20 solid ones.
function rate(b) { return (b.ok + 1) / (b.ok + b.fail + 2); }

export function orderedBackends(channel, staticOrder) {
  const learned = loadMemory().channels[channel];
  if (!learned || Math.random() < EPSILON) return [...staticOrder];
  return [...staticOrder].sort((x, y) => {
    const rx = learned[x] ? rate(learned[x]) : 0.5; // unseen backend = neutral prior
    const ry = learned[y] ? rate(learned[y]) : 0.5;
    if (ry !== rx) return ry - rx;
    return staticOrder.indexOf(x) - staticOrder.indexOf(y); // stable: fall back to documented order
  });
}

// Try each backend in learned order until one succeeds. impls = { backendId: async () => result }.
export async function runChannel(channel, impls, staticOrder = Object.keys(impls)) {
  const order = orderedBackends(channel, staticOrder);
  let lastErr;
  for (const id of order) {
    const t0 = Date.now();
    try {
      const result = await impls[id]();
      recordOutcome(channel, id, true, Date.now() - t0);
      return { backend: id, result };
    } catch (e) {
      recordOutcome(channel, id, false, Date.now() - t0, e?.message || e);
      lastErr = e;
    }
  }
  throw new Error(`semua backend ${channel} gagal (${order.join(", ")}): ${lastErr?.message || lastErr}`);
}

const UA = "jangkau/0.1 (+https://github.com/ryanda9910/jangkau)";

export async function fetchJson(url, opts = {}) {
  const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(opts.timeout || 15000), headers: { "user-agent": UA, accept: "application/json", ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  const ct = r.headers.get("content-type") || "";
  const text = await r.text();
  if (!ct.includes("json") && text.trimStart().startsWith("<")) throw new Error(`non-JSON response ${url}`);
  return JSON.parse(text);
}

export async function fetchText(url, opts = {}) {
  const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(opts.timeout || 15000), headers: { "user-agent": UA, ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
}

// Tiny RSS item extractor — enough for the news feeds we consume, zero deps.
export function parseRss(xml) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);
  for (const b of blocks) {
    const get = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim() : "";
    };
    items.push({ title: get("title"), link: get("link"), pubDate: get("pubDate"), description: get("description").slice(0, 300) });
  }
  return items.filter((i) => i.title);
}

export function loadConfig() {
  try { return JSON.parse(readFileSync(join(HOME, "config.json"), "utf8")); } catch { return {}; }
}

export function saveConfig(cfg) { ensureHome(); writeFileSync(join(HOME, "config.json"), JSON.stringify(cfg, null, 2)); }
