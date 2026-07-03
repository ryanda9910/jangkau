// maritim — kondisi laut (tinggi gelombang, arah, periode, swell, suhu muka laut)
// untuk perairan/kota pesisir Indonesia. Open-Meteo Marine, tanpa key. Data vital
// untuk nelayan & pelayaran. Nama tempat diresolve lewat perairan populer atau kodepos.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "maritim",
  description: "Kondisi laut / gelombang (Open-Meteo Marine)",
  tier: 0,
  backends: ["open-meteo-marine"],
  usage: "jangkau maritim <perairan/kota pesisir>  (contoh: selat sunda, natuna, bali)",
};

// perairan & titik pesisir yang sering ditanya (lat, lon di laut)
const PERAIRAN = {
  "selat sunda": [-6.0, 105.9], "selat malaka": [3.0, 99.5], "laut jawa": [-5.5, 110.5],
  "selat bali": [-8.4, 114.4], "selat lombok": [-8.6, 115.8], "natuna": [3.5, 108.2],
  "laut banda": [-5.5, 128.0], "laut arafura": [-8.5, 135.0], "selat karimata": [-1.5, 108.5],
  "samudra hindia": [-10.0, 105.0], "laut sulawesi": [3.0, 122.0], "laut flores": [-7.5, 121.0],
  "teluk jakarta": [-6.0, 106.8], "pangandaran": [-7.7, 108.6], "anyer": [-6.2, 105.9],
  "bali": [-8.7, 115.2], "lombok": [-8.7, 116.3], "pelabuhan ratu": [-7.0, 106.5],
};
const norm = (s) => s.toLowerCase().trim();

async function resolve(q) {
  const key = norm(q);
  if (PERAIRAN[key]) return { lat: PERAIRAN[key][0], lon: PERAIRAN[key][1], nama: q };
  const partial = Object.keys(PERAIRAN).find((k) => k.includes(key) || key.includes(k));
  if (partial) return { lat: PERAIRAN[partial][0], lon: PERAIRAN[partial][1], nama: partial };
  // fallback: coastal town via kodepos (its coords are near shore for coastal names)
  const d = await fetchJson(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(q)}`);
  const hit = d.data?.[0];
  if (!hit) throw new Error(`perairan/tempat tidak ketemu: ${q} (coba: selat sunda, natuna, bali)`);
  return { lat: hit.latitude, lon: hit.longitude, nama: `${hit.village}, ${hit.regency}` };
}

const arah = (deg) => ["Utara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"][Math.round(deg / 45) % 8];
const kategori = (h) => (h < 0.5 ? "Tenang" : h < 1.25 ? "Rendah" : h < 2.5 ? "Sedang" : h < 4 ? "Tinggi" : "Sangat tinggi (bahaya)");

export async function run(args) {
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih perairan/kota pesisir: jangkau maritim selat sunda");
  const loc = await resolve(q);
  const { result } = await runChannel("maritim", {
    "open-meteo-marine": async () => {
      const d = await fetchJson(`https://marine-api.open-meteo.com/v1/marine?latitude=${loc.lat}&longitude=${loc.lon}&current=wave_height,wave_direction,wave_period,swell_wave_height,sea_surface_temperature&timezone=Asia%2FJakarta`);
      const c = d.current;
      if (c?.wave_height == null) throw new Error("tidak ada data gelombang (mungkin titik di darat)");
      return c;
    },
  });
  return {
    lokasi: loc.nama,
    koordinat: `${loc.lat},${loc.lon}`,
    tinggi_gelombang: `${result.wave_height} m`,
    kategori: kategori(result.wave_height),
    arah_gelombang: `${arah(result.wave_direction)} (${result.wave_direction}°)`,
    periode: `${result.wave_period} detik`,
    swell: result.swell_wave_height != null ? `${result.swell_wave_height} m` : "—",
    suhu_permukaan_laut: result.sea_surface_temperature != null ? `${result.sea_surface_temperature}°C` : "—",
    waktu: result.time,
    catatan: "acuan Open-Meteo; untuk keselamatan pelayaran cek juga peringatan dini BMKG",
  };
}

export async function check() {
  const d = await fetchJson("https://marine-api.open-meteo.com/v1/marine?latitude=-6.0&longitude=105.9&current=wave_height&timezone=Asia%2FJakarta", { timeout: 10000 });
  if (d.current?.wave_height == null) throw new Error("format berubah");
  return `Selat Sunda gelombang ${d.current.wave_height} m`;
}
