// gempa — BMKG earthquake feeds (open JSON, no key).
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "gempa",
  description: "Gempa bumi terkini (BMKG)",
  tier: 0,
  backends: ["bmkg-tews"],
  usage: "jangkau gempa [--m5|--dirasakan]",
};

const BASE = "https://data.bmkg.go.id/DataMKG/TEWS";

export async function run(args) {
  const mode = args.includes("--m5") ? "gempaterkini" : args.includes("--dirasakan") ? "gempadirasakan" : "autogempa";
  const { result } = await runChannel("gempa", {
    "bmkg-tews": async () => {
      const d = await fetchJson(`${BASE}/${mode}.json`);
      return d.Infogempa;
    },
  });
  const list = result.gempa ? (Array.isArray(result.gempa) ? result.gempa : [result.gempa]) : [];
  return list.map((g) => ({
    waktu: `${g.Tanggal} ${g.Jam}`,
    magnitudo: g.Magnitude,
    kedalaman: g.Kedalaman,
    wilayah: g.Wilayah,
    potensi: g.Potensi || "",
    dirasakan: g.Dirasakan || "",
    koordinat: g.Coordinates,
  }));
}

export async function check() {
  const d = await fetchJson(`${BASE}/autogempa.json`, { timeout: 8000 });
  if (!d.Infogempa?.gempa) throw new Error("format berubah");
  return `gempa terakhir M${d.Infogempa.gempa.Magnitude} ${d.Infogempa.gempa.Wilayah.slice(0, 40)}`;
}
