// cuaca — BMKG public weather forecast. BMKG only accepts village-level adm4
// codes in the KEMENDAGRI numbering (Permendagri 72/2019) — NOT the BPS codes
// the wilayah channel serves. Free text is resolved against the kodewilayah
// base.csv (downloaded once, cached in ~/.jangkau/kemendagri.csv).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fetchJson, fetchText, runChannel, HOME } from "../core.mjs";

export const meta = {
  name: "cuaca",
  description: "Prakiraan cuaca (BMKG, level desa)",
  tier: 0,
  backends: ["kemendagri-gh", "kemendagri-jsdelivr"],
  usage: "jangkau cuaca <desa/kecamatan> [kabupaten]",
};

const CSV_CACHE = join(HOME, "kemendagri.csv");
const CSV_SOURCES = {
  "kemendagri-gh": "https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/main/dist/base.csv",
  "kemendagri-jsdelivr": "https://cdn.jsdelivr.net/gh/kodewilayah/permendagri-72-2019@main/dist/base.csv",
};

async function loadCsv(sourceId) {
  if (existsSync(CSV_CACHE)) return readFileSync(CSV_CACHE, "utf8");
  const text = await fetchText(CSV_SOURCES[sourceId], { timeout: 30000 });
  if (!text.startsWith("11,")) throw new Error("format base.csv berubah");
  writeFileSync(CSV_CACHE, text);
  return text;
}

const norm = (s) => s.toLowerCase().replace(/^(kabupaten|kota|kab\.?|kec\.?|kecamatan|desa|kelurahan)\s+/i, "").trim();

function resolveAdm4(csv, desaQ, kabQ) {
  const dq = norm(desaQ), kq = norm(kabQ || "");
  const names = new Map(); // code -> name, for ancestor lookups
  const villages = [];
  for (const line of csv.split("\n")) {
    const i = line.indexOf(",");
    if (i < 0) continue;
    const code = line.slice(0, i), name = line.slice(i + 1).trim();
    names.set(code, name);
    if (code.split(".").length === 4) villages.push([code, name]);
  }
  const kabOf = (code) => names.get(code.split(".").slice(0, 2).join(".")) || "";
  const kecOf = (code) => names.get(code.split(".").slice(0, 3).join(".")) || "";
  // prefer exact village-name match, then kecamatan-name match; filter by kabupaten if given
  const pool = kq ? villages.filter(([c]) => norm(kabOf(c)).includes(kq)) : villages;
  const hit =
    pool.find(([, n]) => norm(n) === dq) ||
    pool.find(([, n]) => norm(n).includes(dq)) ||
    pool.find(([c]) => norm(kecOf(c)) === dq) ||
    pool.find(([c]) => norm(kecOf(c)).includes(dq));
  if (!hit) throw new Error(`desa/kecamatan tidak ketemu: ${desaQ}${kabQ ? " di " + kabQ : ""}`);
  return { adm4: hit[0], desa: hit[1], kecamatan: kecOf(hit[0]), kabupaten: kabOf(hit[0]) };
}

async function bmkg(adm4) {
  const d = await fetchJson(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`);
  const lok = d.lokasi;
  const slots = (d.data?.[0]?.cuaca || []).flat().slice(0, 8);
  return {
    lokasi: `${lok.desa}, ${lok.kecamatan}, ${lok.kotkab}, ${lok.provinsi}`,
    prakiraan: slots.map((s) => ({ jam: s.local_datetime, cuaca: s.weather_desc, suhu: `${s.t}°C`, kelembapan: `${s.hu}%`, angin: `${s.ws} km/j ${s.wd}` })),
  };
}

export async function run(args) {
  const words = args.filter((a) => !a.startsWith("--"));
  if (!words.length) throw new Error("kasih lokasi: jangkau cuaca jasinga bogor");
  const desaQ = words[0];
  const kabQ = words.slice(1).join(" ");
  const impls = {};
  for (const id of Object.keys(CSV_SOURCES)) {
    impls[id] = async () => {
      const r = resolveAdm4(await loadCsv(id), desaQ, kabQ);
      return bmkg(r.adm4);
    };
  }
  const { result } = await runChannel("cuaca", impls);
  return result;
}

export async function check() {
  const d = await fetchJson("https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.01.19.2005", { timeout: 10000 });
  if (!d.lokasi) throw new Error("format berubah");
  return `contoh: ${d.lokasi.desa}, ${d.lokasi.kotkab}${existsSync(CSV_CACHE) ? " (CSV Kemendagri tercache)" : ""}`;
}
