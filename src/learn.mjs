// learn — the reflector. Reads the trajectory log (every backend attempt with
// its outcome) and prints per-channel/backend verdicts: what is reliable on
// THIS machine/network, what keeps dying, and which backend the router will
// prefer next run. The stats themselves are already updated incrementally on
// every call (core.recordOutcome) — this command makes the learning inspectable.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { HOME, loadMemory } from "./core.mjs";

export function learnReport() {
  const logPath = join(HOME, "learn.jsonl");
  if (!existsSync(logPath)) return "belum ada trajektori — pakai kanal apa pun dulu, lalu jalankan lagi.";
  const rows = readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const mem = loadMemory().channels;
  const lines = [`Refleksi ${rows.length} trajektori`, "=".repeat(40)];
  for (const [ch, backends] of Object.entries(mem)) {
    lines.push("", `${ch}:`);
    for (const [b, s] of Object.entries(backends)) {
      const n = s.ok + s.fail;
      const pct = Math.round((s.ok / n) * 100);
      const verdict = n >= 3 && pct < 40 ? "🔴 sering gagal — router menurunkan prioritas" : pct === 100 ? "🟢 andal" : "🟡 campur";
      lines.push(`  ${b}: ${s.ok}✓/${s.fail}✗ (${pct}%) ${verdict}${s.lastErr ? ` — error terakhir: ${s.lastErr}` : ""}`);
    }
  }
  const recentFails = rows.filter((r) => !r.ok).slice(-5);
  if (recentFails.length) {
    lines.push("", "Kegagalan terakhir:");
    for (const f of recentFails) lines.push(`  ${f.at.slice(0, 16)} ${f.channel}/${f.backend}: ${f.err}`);
  }
  lines.push("", `Memori: ${join(HOME, "memory.json")} (router baca tiap run, epsilon 0.1 tetap coba urutan asli)`);
  return lines.join("\n");
}
