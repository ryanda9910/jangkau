// pesawat — live aircraft over Indonesian airspace (OpenSky Network, no key).
// Bounding box covers the archipelago (~95E-141E, 11S-6N). Anonymous OpenSky
// is rate-limited, so this is best-effort snapshot, not continuous tracking.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "pesawat",
  description: "Pesawat terbang di wilayah udara Indonesia (OpenSky, realtime)",
  tier: 0,
  backends: ["opensky"],
  usage: "jangkau pesawat [--limit N]",
};

const BOX = "lamin=-11&lomin=95&lamax=6&lomax=141";

export async function run(args) {
  const li = args.indexOf("--limit");
  const limit = li > -1 ? parseInt(args[li + 1], 10) || 15 : 15;
  const { result } = await runChannel("pesawat", {
    opensky: async () => {
      const d = await fetchJson(`https://opensky-network.org/api/states/all?${BOX}`, { timeout: 15000 });
      if (!Array.isArray(d.states)) throw new Error("format berubah / rate-limited");
      return d.states;
    },
  });
  // OpenSky state vector indices: 1=callsign 2=origin_country 5=lon 6=lat 7=baro_alt 9=velocity 10=heading 13=geo_alt
  const rows = result
    .filter((s) => s[5] != null && s[6] != null)
    .sort((a, b) => (b[13] || b[7] || 0) - (a[13] || a[7] || 0))
    .slice(0, limit)
    .map((s) => ({
      callsign: (s[1] || "").trim() || "—",
      asal: s[2],
      posisi: `${s[6].toFixed(2)}, ${s[5].toFixed(2)}`,
      ketinggian: s[13] != null ? `${Math.round(s[13])} m` : s[7] != null ? `${Math.round(s[7])} m` : "—",
      kecepatan: s[9] != null ? `${Math.round(s[9] * 3.6)} km/j` : "—",
      arah: s[10] != null ? `${Math.round(s[10])}°` : "—",
    }));
  return { total_di_wilayah: result.length, ditampilkan: rows.length, pesawat: rows };
}

export async function check() {
  const d = await fetchJson(`https://opensky-network.org/api/states/all?${BOX}`, { timeout: 12000 });
  if (!Array.isArray(d.states)) throw new Error("rate-limited / format berubah");
  return `${d.states.length} pesawat di wilayah ID`;
}
