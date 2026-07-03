// ihsg — Indonesian stock market indices (Jakarta Composite + LQ45) via Yahoo
// Finance. Same proven q1/q2 path as the saham channel, but for indices, so it
// must NOT append the .JK equity suffix.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "ihsg",
  description: "Indeks bursa Indonesia: IHSG + LQ45 (data, bukan rekomendasi)",
  tier: 0,
  backends: ["yahoo-q1", "yahoo-q2"],
  usage: "jangkau ihsg [lq45]",
};

const INDICES = { ihsg: "^JKSE", lq45: "^JKLQ45" };

async function quote(host, symbol) {
  const d = await fetchJson(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`, { headers: { accept: "*/*" }, timeout: 12000 });
  const m = d.chart?.result?.[0]?.meta;
  if (!m?.regularMarketPrice) throw new Error("tidak ada data indeks");
  const prev = m.chartPreviousClose ?? m.previousClose;
  const chg = prev ? (((m.regularMarketPrice - prev) / prev) * 100).toFixed(2) : null;
  return {
    indeks: symbol === "^JKSE" ? "IHSG (Jakarta Composite)" : symbol === "^JKLQ45" ? "LQ45" : symbol,
    nilai: m.regularMarketPrice.toLocaleString("id-ID", { maximumFractionDigits: 2 }),
    perubahan: chg != null ? `${chg > 0 ? "+" : ""}${chg}%` : "n/a",
    range_hari: `${m.regularMarketDayLow?.toLocaleString("id-ID")} - ${m.regularMarketDayHigh?.toLocaleString("id-ID")}`,
    bursa: m.fullExchangeName || "Jakarta",
  };
}

export async function run(args) {
  const which = (args.find((a) => !a.startsWith("--")) || "ihsg").toLowerCase();
  const symbol = INDICES[which] || INDICES.ihsg;
  const { result } = await runChannel("ihsg", {
    "yahoo-q1": () => quote("query1.finance.yahoo.com", symbol),
    "yahoo-q2": () => quote("query2.finance.yahoo.com", symbol),
  });
  return { ...result, catatan: "data indeks, bukan rekomendasi investasi" };
}

export async function check() {
  const r = await quote("query1.finance.yahoo.com", "^JKSE");
  return `IHSG ${r.nilai} (${r.perubahan})`;
}
