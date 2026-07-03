// kodepos — Indonesian postal codes with coordinates (sooluh/kodepos API).
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "kodepos",
  description: "Kode pos + koordinat (cari nama desa/kecamatan)",
  tier: 0,
  backends: ["sooluh"],
  usage: "jangkau kodepos <nama tempat>",
};

export async function run(args) {
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih nama tempat: jangkau kodepos jasinga");
  const { result } = await runChannel("kodepos", {
    sooluh: async () => {
      const d = await fetchJson(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(q)}`);
      if (!d.data?.length) throw new Error(`tidak ketemu: ${q}`);
      return d.data;
    },
  });
  return result.slice(0, 10).map((r) => ({ kodepos: r.code, desa: r.village, kecamatan: r.district, kabupaten: r.regency, provinsi: r.province, koordinat: `${r.latitude},${r.longitude}` }));
}

export async function check() {
  const d = await fetchJson("https://kodepos.vercel.app/search/?q=menteng", { timeout: 8000 });
  if (!d.data?.length) throw new Error("API kosong");
  return `${d.data.length} hasil utk "menteng"`;
}
