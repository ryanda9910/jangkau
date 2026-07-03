// wilayah — Indonesian administrative regions (emsifa static JSON, BPS codes).
// NOTE: these are BPS codes; BMKG weather uses KEMENDAGRI codes (see cuaca.mjs).
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "wilayah",
  description: "Wilayah administratif (provinsi→desa, kode BPS)",
  tier: 0,
  backends: ["emsifa"],
  usage: "jangkau wilayah <nama provinsi/kab/kec/desa>",
};

const BASE = "https://www.emsifa.com/api-wilayah-indonesia/api";
const norm = (s) => s.toLowerCase().replace(/^(kabupaten|kota|kab\.?|kec\.?|kecamatan|desa|kelurahan)\s+/i, "").trim();

async function j(path) { return fetchJson(`${BASE}/${path}`); }

export async function run(args) {
  const q = norm(args.filter((a) => !a.startsWith("--")).join(" "));
  if (!q) throw new Error("kasih nama wilayah: jangkau wilayah bogor");
  const { result } = await runChannel("wilayah", {
    emsifa: async () => {
      const provs = await j("provinces.json");
      const hits = [];
      for (const p of provs) {
        if (p.name.toLowerCase().includes(q)) hits.push({ tingkat: "provinsi", kode: p.id, nama: p.name });
      }
      // then regencies, province by province, stopping once we have enough hits
      for (const p of provs) {
        const regs = await j(`regencies/${p.id}.json`);
        for (const r of regs) if (norm(r.name).includes(q)) hits.push({ tingkat: "kab/kota", kode: r.id, nama: r.name, provinsi: p.name });
        if (hits.length >= 10) break;
      }
      if (!hits.length) throw new Error(`tidak ketemu: ${q}`);
      return hits.slice(0, 10);
    },
  });
  return result;
}

export async function check() {
  const provs = await fetchJson(`${BASE}/provinces.json`, { timeout: 8000 });
  if (!Array.isArray(provs) || provs.length < 30) throw new Error("data provinsi tidak lengkap");
  return `${provs.length} provinsi`;
}
