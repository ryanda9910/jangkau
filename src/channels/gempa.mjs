// gempa — BMKG earthquake feeds (open, no key).
//   bmkg-tews : curated JSON (autogempa=1, gempaterkini/dirasakan=15) + Potensi field
//   inatews   : raw INATEWS live feed (~30 latest events, incl small M<3) as fallback/--live
import { fetchJson, fetchText, runChannel } from "../core.mjs";

export const meta = {
  name: "gempa",
  description: "Gempa bumi terkini + potensi tsunami (BMKG)",
  tier: 0,
  backends: ["bmkg-tews", "inatews"],
  usage: "jangkau gempa [--m5|--dirasakan|--tsunami|--live]",
};

const BASE = "https://data.bmkg.go.id/DataMKG/TEWS";
const INATEWS = "https://bmkg-content-inatews.storage.googleapis.com/live30event.xml";

// Parse INATEWS live30event.xml (30 latest events) with a tiny regex, zero deps.
function parseInatews(xml) {
  return [...xml.matchAll(/<gempa>([\s\S]*?)<\/gempa>/g)].map((m) => {
    const g = (t) => (m[1].match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) || [, ""])[1].trim();
    return { waktu: g("waktu"), magnitudo: g("mag"), kedalaman: `${g("dalam")} km`, wilayah: g("area"), koordinat: `${g("lintang")},${g("bujur")}`, potensi: "", tsunami: false, dirasakan: "" };
  });
}

export async function run(args) {
  // --live: raw INATEWS feed = ~30 latest events incl small quakes (richer than TEWS).
  if (args.includes("--live")) {
    const { result } = await runChannel("gempa", {
      inatews: async () => parseInatews(await fetchText(INATEWS)),
    });
    return result;
  }
  // --tsunami: BMKG has no separate tsunami feed; the signal lives in the
  // `Potensi` field of the M5+ list ("Berpotensi/Tidak berpotensi tsunami").
  const tsunami = args.includes("--tsunami");
  const mode = tsunami || args.includes("--m5") ? "gempaterkini" : args.includes("--dirasakan") ? "gempadirasakan" : "autogempa";
  const { result } = await runChannel("gempa", {
    "bmkg-tews": async () => {
      const d = await fetchJson(`${BASE}/${mode}.json`);
      return d.Infogempa;
    },
    // fallback if TEWS JSON is down: serve INATEWS raw so the channel still answers
    inatews: async () => ({ gempa: parseInatews(await fetchText(INATEWS)).map((g) => ({ Tanggal: g.waktu, Jam: "", Magnitude: g.magnitudo, Kedalaman: g.kedalaman, Wilayah: g.wilayah, Potensi: "", Coordinates: g.koordinat })) }),
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
