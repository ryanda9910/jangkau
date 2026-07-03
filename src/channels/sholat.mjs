// sholat — jadwal sholat harian per kota Indonesia (myQuran API, tanpa key).
// Nama kota diresolve otomatis lewat endpoint pencarian kota.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "sholat",
  description: "Jadwal sholat harian per kota (myQuran)",
  tier: 0,
  backends: ["myquran"],
  usage: "jangkau sholat <kota> [YYYY-MM-DD]",
};

const BASE = "https://api.myquran.com/v2";

async function findKota(q) {
  const d = await fetchJson(`${BASE}/sholat/kota/cari/${encodeURIComponent(q)}`);
  const hit = d.data?.[0];
  if (!hit) throw new Error(`kota tidak ketemu: ${q}`);
  return hit; // {id, lokasi}
}

export async function run(args) {
  const words = args.filter((a) => !a.startsWith("--"));
  const dateArg = words.find((w) => /^\d{4}-\d{2}-\d{2}$/.test(w));
  const kotaQ = words.filter((w) => w !== dateArg).join(" ");
  if (!kotaQ) throw new Error("kasih kota: jangkau sholat jakarta");
  // default = hari ini di WIB (user Indonesia), bukan UTC
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD
  const [y, m, d] = (dateArg || today).split("-");

  const { result } = await runChannel("sholat", {
    myquran: async () => {
      const kota = await findKota(kotaQ);
      const r = await fetchJson(`${BASE}/sholat/jadwal/${kota.id}/${y}/${m}/${d}`);
      if (!r.data?.jadwal) throw new Error("jadwal tidak ada");
      return { lokasi: r.data.lokasi, daerah: r.data.daerah, jadwal: r.data.jadwal };
    },
  });
  const j = result.jadwal;
  return {
    lokasi: `${result.lokasi}, ${result.daerah}`,
    tanggal: j.tanggal,
    imsak: j.imsak, subuh: j.subuh, terbit: j.terbit,
    dzuhur: j.dzuhur, ashar: j.ashar, maghrib: j.maghrib, isya: j.isya,
  };
}

export async function check() {
  const r = await fetchJson(`${BASE}/sholat/jadwal/1301/2026/07/04`, { timeout: 8000 });
  if (!r.data?.jadwal?.subuh) throw new Error("format berubah");
  return `contoh Jakarta subuh ${r.data.jadwal.subuh}`;
}
