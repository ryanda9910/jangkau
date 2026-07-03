// saham — IDX stock quotes via Yahoo Finance chart API (.JK suffix).
// Works from residential IPs; datacenter IPs are often blocked by Yahoo —
// exactly the kind of per-network fact the learned router records.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "saham",
  description: "Harga saham IDX (data Yahoo Finance, DATA bukan rekomendasi)",
  tier: 0,
  backends: ["yahoo-q1", "yahoo-q2"],
  usage: "jangkau saham <KODE>  (contoh: BBCA, TLKM.JK)",
};

async function quote(host, ticker) {
  const d = await fetchJson(`https://${host}/v8/finance/chart/${ticker}?range=5d&interval=1d`, { headers: { accept: "*/*" } });
  const meta = d.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error("tidak ada data harga");
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const chg = prevClose ? (((meta.regularMarketPrice - prevClose) / prevClose) * 100).toFixed(2) : null;
  return {
    kode: meta.symbol,
    nama: meta.longName || meta.shortName || "",
    harga: `Rp${meta.regularMarketPrice.toLocaleString("id-ID")}`,
    perubahan: chg !== null ? `${chg > 0 ? "+" : ""}${chg}%` : "n/a",
    range_hari: `${meta.regularMarketDayLow?.toLocaleString("id-ID")} - ${meta.regularMarketDayHigh?.toLocaleString("id-ID")}`,
    catatan: "data Yahoo Finance, bukan rekomendasi investasi",
  };
}

export async function run(args) {
  let t = (args.find((a) => !a.startsWith("--")) || "").toUpperCase();
  if (!t) throw new Error("kasih kode saham: jangkau saham BBCA");
  if (!t.includes(".")) t += ".JK";
  const { result } = await runChannel("saham", {
    "yahoo-q1": () => quote("query1.finance.yahoo.com", t),
    "yahoo-q2": () => quote("query2.finance.yahoo.com", t),
  });
  return result;
}

export async function check() {
  const r = await quote("query1.finance.yahoo.com", "BBCA.JK");
  return `BBCA ${r.harga}`;
}
