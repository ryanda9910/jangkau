// test-unit.mjs — OFFLINE deterministic tests (no network). Safe for CI on every
// push/PR. Covers pure logic: the self-learning router ordering + trajectory
// bookkeeping, RSS/INATEWS parsing, and the tsunami-potential classifier.
// Live-endpoint coverage lives in test.sh (run locally / on a schedule).
import assert from "node:assert";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// isolate router state to a temp HOME so tests never touch the real ~/.jangkau
process.env.HOME = mkdtempSync(join(tmpdir(), "jangkau-test-"));

const { parseRss, orderedBackends, runChannel, loadMemory } = await import("./src/core.mjs");

let pass = 0;
const t = (name, fn) => { try { fn(); console.log("  ✅ " + name); pass++; } catch (e) { console.log("  ❌ " + name + " — " + e.message); process.exitCode = 1; } };
const ta = async (name, fn) => { try { await fn(); console.log("  ✅ " + name); pass++; } catch (e) { console.log("  ❌ " + name + " — " + e.message); process.exitCode = 1; } };

console.log("jangkau unit tests (offline)");

// --- parseRss ---
t("parseRss extracts items", () => {
  const xml = `<rss><item><title>Judul A</title><link>http://a</link><pubDate>x</pubDate></item><item><title><![CDATA[Judul B]]></title><link>http://b</link></item></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Judul A");
  assert.equal(items[1].title, "Judul B"); // CDATA unwrapped
});
t("parseRss tolerates empty", () => assert.equal(parseRss("<rss></rss>").length, 0));

// --- router: orderedBackends prefers the learned winner ---
await ta("router learns backend order", async () => {
  // seed memory: backend B proven, backend A proven-bad, via runChannel outcomes
  for (let i = 0; i < 20; i++) {
    await runChannel("t_chan", { A: async () => { throw new Error("fail"); }, B: async () => "ok" }, ["A", "B"]).catch(() => {});
  }
  const mem = loadMemory().channels["t_chan"];
  assert.ok(mem.B.ok >= 1, "B should have successes");
  assert.ok(mem.A.fail >= 1, "A should have failures");
  // with epsilon exploration, the learned order should put B first the large majority of the time
  let bFirst = 0;
  for (let i = 0; i < 200; i++) if (orderedBackends("t_chan", ["A", "B"])[0] === "B") bFirst++;
  assert.ok(bFirst > 140, `B should lead most runs, got ${bFirst}/200`);
});

// --- router: runChannel returns first success + records it ---
await ta("runChannel falls through to a working backend", async () => {
  const { result, backend } = await runChannel("t_fall", { x: async () => { throw new Error("down"); }, y: async () => 42 }, ["x", "y"]);
  assert.equal(result, 42);
  assert.equal(backend, "y");
});

await ta("runChannel throws when all backends fail", async () => {
  await assert.rejects(() => runChannel("t_dead", { a: async () => { throw new Error("no"); } }, ["a"]));
});

// --- tsunami classifier (mirror of gempa.mjs logic; keep in sync) ---
t("tsunami classifier: berpotensi vs tidak berpotensi", () => {
  const berpotensi = (p) => /berpotensi tsunami/i.test(p || "") && !/tidak berpotensi/i.test(p || "");
  assert.equal(berpotensi("Berpotensi tsunami"), true);
  assert.equal(berpotensi("Tidak berpotensi tsunami"), false);
  assert.equal(berpotensi(""), false);
});

console.log(`\n${pass} unit test lulus${process.exitCode ? " (ADA GAGAL)" : ""}`);
