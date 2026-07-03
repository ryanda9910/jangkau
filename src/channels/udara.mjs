// udara — air quality for any Indonesian coordinate/city. Open-Meteo air
// quality API is keyless and global; WAQI is an optional backend (real ground
// stations) if the user supplies a free token. Location is resolved to lat/lon
// via the kodepos channel's data so you can say a place name, not coordinates.
import { fetchJson, runChannel, loadConfig, saveConfig } from "../core.mjs";

export const meta = {
  name: "udara",
  description: "Kualitas udara / AQI (Open-Meteo, tanpa key; WAQI opsional)",
  tier: 0,
  backends: ["open-meteo", "waqi"],
  usage: "jangkau udara <kota/tempat>  |  jangkau udara --waqi <TOKEN>",
};

// coarse city fallback so "jakarta" works without a kodepos round-trip
const CITIES = {
  jakarta: [-6.2, 106.8], bandung: [-6.9, 107.6], surabaya: [-7.25, 112.75],
  medan: [3.59, 98.67], semarang: [-6.97, 110.42], makassar: [-5.15, 119.43],
  denpasar: [-8.65, 115.22], yogyakarta: [-7.8, 110.36], bogor: [-6.6, 106.8],
  palembang: [-2.98, 104.76], batam: [1.08, 104.03], pekanbaru: [0.51, 101.45],
};

const AQI_LABEL = (a) =>
  a <= 50 ? "Baik" : a <= 100 ? "Sedang" : a <= 150 ? "Tidak sehat (kel. sensitif)" : a <= 200 ? "Tidak sehat" : a <= 300 ? "Sangat tidak sehat" : "Berbahaya";

async function resolve(q) {
  const key = q.toLowerCase().trim();
  if (CITIES[key]) return { lat: CITIES[key][0], lon: CITIES[key][1], nama: q };
  // fall back to kodepos search for coordinates
  const d = await fetchJson(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(q)}`);
  const hit = d.data?.[0];
  if (!hit) throw new Error(`lokasi tidak ketemu: ${q}`);
  return { lat: hit.latitude, lon: hit.longitude, nama: `${hit.village}, ${hit.regency}` };
}

export async function run(args) {
  const wi = args.indexOf("--waqi");
  if (wi > -1) {
    const cfg = loadConfig();
    cfg.waqi_token = args[wi + 1];
    saveConfig(cfg);
    return { ok: "token WAQI tersimpan (backend stasiun darat aktif)" };
  }
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih lokasi: jangkau udara jakarta");
  const loc = await resolve(q);
  const waqiToken = loadConfig().waqi_token || process.env.WAQI_TOKEN;

  const { result, backend } = await runChannel("udara", {
    "open-meteo": async () => {
      const d = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide&timezone=Asia%2FJakarta`);
      const c = d.current;
      if (c?.us_aqi == null) throw new Error("tidak ada data AQI");
      return { aqi: c.us_aqi, kategori: AQI_LABEL(c.us_aqi), pm2_5: c.pm2_5, pm10: c.pm10, co: c.carbon_monoxide, ozon: c.ozone, no2: c.nitrogen_dioxide, so2: c.sulphur_dioxide, waktu: c.time, sumber: "Open-Meteo (model)" };
    },
    waqi: async () => {
      if (!waqiToken) throw new Error("tanpa token WAQI (opsional)");
      const d = await fetchJson(`https://api.waqi.info/feed/geo:${loc.lat};${loc.lon}/?token=${waqiToken}`);
      if (d.status !== "ok") throw new Error(d.data || "WAQI error");
      const x = d.data;
      return { aqi: x.aqi, kategori: AQI_LABEL(x.aqi), pm2_5: x.iaqi?.pm25?.v, pm10: x.iaqi?.pm10?.v, ozon: x.iaqi?.o3?.v, no2: x.iaqi?.no2?.v, stasiun: x.city?.name, waktu: x.time?.s, sumber: "WAQI (stasiun darat)" };
    },
  });
  return { lokasi: loc.nama, koordinat: `${loc.lat},${loc.lon}`, ...result, catatan: backend === "open-meteo" ? "AQI dari model, bukan stasiun darat; untuk stasiun beri token WAQI gratis (aqicn.org/data-platform/token)" : undefined };
}

export async function check() {
  const d = await fetchJson("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-6.2&longitude=106.8&current=us_aqi&timezone=Asia%2FJakarta", { timeout: 10000 });
  if (d.current?.us_aqi == null) throw new Error("format berubah");
  return `Jakarta AQI ${d.current.us_aqi} (${AQI_LABEL(d.current.us_aqi)})`;
}
