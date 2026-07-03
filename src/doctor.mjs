// doctor — real health checks (actually hits each channel's live endpoint,
// never just "is it configured"). One broken channel never takes the report
// down. Shows the LEARNED backend order when it differs from the documented one.
import { CHANNELS } from "./channels/index.mjs";
import { loadMemory } from "./core.mjs";

export async function doctor() {
  const mem = loadMemory().channels;
  const lines = ["Jangkau — status kanal", "=".repeat(40)];
  let ok = 0, total = 0;
  const results = await Promise.all(
    Object.values(CHANNELS).map(async (ch) => {
      const t0 = Date.now();
      try {
        const msg = await ch.check();
        return { ch, status: "ok", msg, ms: Date.now() - t0 };
      } catch (e) {
        return { ch, status: e?.warn ? "warn" : "off", msg: e?.message || String(e), ms: Date.now() - t0 };
      }
    })
  );
  for (const tier of [0, 1]) {
    const rows = results.filter((r) => r.ch.meta.tier === tier);
    if (!rows.length) continue;
    lines.push("", tier === 0 ? "Langsung pakai (tanpa konfigurasi):" : "Perlu key gratis:");
    for (const r of rows) {
      total++;
      const icon = r.status === "ok" ? "✅" : r.status === "warn" ? "[!]" : "[X]";
      if (r.status === "ok") ok++;
      let line = `  ${icon} ${r.ch.meta.name} — ${r.ch.meta.description} — ${r.msg} (${r.ms}ms)`;
      const learned = mem[r.ch.meta.name];
      if (learned && r.ch.meta.backends.length > 1) {
        const stats = r.ch.meta.backends
          .map((b) => (learned[b] ? `${b} ${learned[b].ok}✓/${learned[b].fail}✗` : `${b} —`))
          .join(", ");
        line += `\n      belajar: ${stats}`;
      }
      lines.push(line);
    }
  }
  lines.push("", `Status: ${ok}/${total} kanal hidup`);
  return lines.join("\n");
}
