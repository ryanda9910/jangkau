// tune — the self-improving loop harness (loop-designer: maker → checker → reflect).
//
//   MAKER    : run every channel's check() live (doctor already does this),
//              recording each backend attempt+outcome to the trajectory log.
//   CHECKER  : an INDEPENDENT grader (didn't run the checks) reads the fresh
//              trajectories and grades this cycle against a goal:
//              "no channel silently degraded — a backend that was healthy and
//               is now failing must be surfaced, not hidden."
//   REFLECT  : the router memory is already updated incrementally on every call
//              (core.recordOutcome); `learn` makes it inspectable.
//
// Run on a cadence (cron) or by hand: `jangkau tune`. The loop makes the router
// converge on whatever backends actually work on THIS machine/network, and
// flags regressions (a backend that used to pass and now fails) for a human.
import { CHANNELS } from "./channels/index.mjs";
import { loadMemory, logTrajectory } from "./core.mjs";
import { learnReport } from "./learn.mjs";

export async function tune() {
  const out = ["jangkau tune — loop self-improving", "=".repeat(42)];

  // snapshot memory BEFORE this cycle so the checker can detect regressions
  const before = loadMemory().channels;

  // --- MAKER: exercise every channel live (each check() logs its own trajectory) ---
  out.push("", "1/3 maker — cek semua kanal live…");
  const results = await Promise.all(
    Object.values(CHANNELS).map(async (ch) => {
      const t0 = Date.now();
      try {
        const msg = await ch.check();
        logTrajectory({ phase: "tune", channel: ch.meta.name, ok: true, ms: Date.now() - t0 });
        return { name: ch.meta.name, ok: true, msg, ms: Date.now() - t0 };
      } catch (e) {
        logTrajectory({ phase: "tune", channel: ch.meta.name, ok: false, err: (e?.message || String(e)).slice(0, 120) });
        return { name: ch.meta.name, ok: false, msg: e?.warn ? "(perlu key)" : e?.message || String(e), warn: !!e?.warn };
      }
    })
  );
  const okN = results.filter((r) => r.ok).length;
  out.push(`   ${okN}/${results.length} kanal sehat.`);

  // --- CHECKER: independent grade — regression = was healthy before, failing now ---
  out.push("", "2/3 checker — grade siklus ini (regresi = dulu andal, kini gagal)…");
  // transient failures (rate-limit/timeout) are NOT regressions — a flaky network
  // moment must not raise a false alarm; only a hard failure of a proven backend does.
  const transient = (m) => /429|too many|timeout|rate.?limit|ETIMEDOUT|ECONNRESET|socket/i.test(m || "");
  const regressions = [];
  for (const r of results) {
    if (r.ok || r.warn || transient(r.msg)) continue;
    const mem = before[r.name];
    if (!mem) continue;
    // "was healthy" = some backend of this channel had >=1 ok and a good ratio
    const wasHealthy = Object.values(mem).some((b) => b.ok >= 1 && b.ok / (b.ok + b.fail) >= 0.5);
    if (wasHealthy) regressions.push(`${r.name}: sebelumnya andal, kini gagal — ${r.msg}`);
  }
  let verdict;
  if (regressions.length) {
    out.push("   ❌ FLAGGED — kanal yang menurun terdeteksi:");
    regressions.forEach((x) => out.push("     ✗ " + x));
    verdict = 1;
  } else {
    out.push("   ✅ PASS — tidak ada kanal andal yang diam-diam menurun.");
    verdict = 0;
  }

  // --- REFLECT: memory already updated live; surface what was learned ---
  out.push("", "3/3 reflect — ringkasan router:");
  out.push(learnReport().split("\n").slice(0, 3).join("\n"));
  out.push("", verdict === 0 ? "LOOP OK" : "LOOP FLAGGED — cek kanal di atas");
  return { text: out.join("\n"), verdict };
}
