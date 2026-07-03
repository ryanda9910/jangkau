// gempa — BMKG earthquake feeds (open JSON, no key).
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "gempa",
  description: "Gempa bumi terkini + potensi tsunami (BMKG)",
  tier: 0,
  backends: ["bmkg-tews"],
  usage: "jangkau gempa [--m5|--dirasakan|--tsunami]",
};

const BASE = "https://data.bmkg.go.id/DataMKG/TEWS";

export async function run(args) {
  // --tsunami: BMKG has no separate tsunami feed; the signal lives in the
  // `Potensi` field of the M5+ list ("Berpotensi/Tidak berpotensi tsunami").
  const tsunami = args.includes("--tsunami");
  const mode = tsunami || args.includes("--m5") ? "gempaterkini" : args.includes("--dirasakan") ? "gempadirasakan" : "autogempa";
  const { result } = await runChannel("gempa", {
    "bmkg-tews": async () => {
      const d = await fetchJson(`${BASE}/${mode}.json`);
      return d.Infogempa;
    },
  });
  // "Berpotensi tsunami" = alert; "Tidak berpotensi tsunami" = safe. Match the
  // former only (the word tsunami without a preceding "tidak").
  const berpotensi = (p) => /berpotensi tsunami/i.test(p || "") && !/tidak berpotensi/i.test(p || "");
  let list = result.gempa ? (Array.isArray(result.gempa) ? result.gempa : [result.gempa]) : [];
  if (tsunami) list = list.filter((g) => berpotensi(g.Potensi));
  const rows = list.map((g) => ({
    waktu: `${g.Tanggal} ${g.Jam}`,
    magnitudo: g.Magnitude,
    kedalaman: g.Kedalaman,
    wilayah: g.Wilayah,
    potensi: g.Potensi || "",
    tsunami: berpotensi(g.Potensi),
    dirasakan: g.Dirasakan || "",
    koordinat: g.Coordinates,
  }));
  if (tsunami && !rows.length) return { info: "Tidak ada gempa berpotensi tsunami di daftar terkini BMKG.", potensi: "aman" };
  return rows;
}

export async function check() {
  const d = await fetchJson(`${BASE}/autogempa.json`, { timeout: 8000 });
  if (!d.Infogempa?.gempa) throw new Error("format berubah");
  return `gempa terakhir M${d.Infogempa.gempa.Magnitude} ${d.Infogempa.gempa.Wilayah.slice(0, 40)}`;
}
