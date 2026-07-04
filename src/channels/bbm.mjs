// bbm — harga BBM Indonesia. Sumber: dataset terverifikasi bbm-predictor (dari
// berita resmi penyesuaian Pertamina, di-host publik), bukan scraping situs SPBU.
// Pertamina non-subsidi = data bulanan terverifikasi; subsidi (Pertalite/Biosolar)
// = harga tetap yang dipatok pemerintah. Shell/BP/Vivo TIDAK disertakan: tidak ada
// sumber data publik legal untuk itu (hanya via scraping situs mereka = di luar
// prinsip jangkau). Lihat catatan di output.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "bbm",
  description: "Harga BBM Indonesia (Pertamina, dari data terverifikasi)",
  tier: 0,
  backends: ["bbm-predictor-gh"],
  usage: "jangkau bbm",
};

const SRC = "https://raw.githubusercontent.com/ryanda9910/bbm-predictor/main/data/history.json";

// BBM subsidi: harga dipatok pemerintah (bukan formula), stabil sepanjang 2026.
const SUBSIDI = [
  { nama: "Pertalite (RON 90)", harga: 10000, jenis: "subsidi" },
  { nama: "Biosolar (CN 48)", harga: 6800, jenis: "subsidi" },
];

const rp = (n) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

export async function run() {
  const { result } = await runChannel("bbm", {
    "bbm-predictor-gh": async () => {
      const d = await fetchJson(SRC, { timeout: 12000 });
      const fuels = Object.entries(d).filter(([k]) => !k.startsWith("_"));
      if (!fuels.length) throw new Error("dataset kosong");
      return fuels;
    },
  });

  let bulan = "";
  const nonSubsidi = result.map(([nama, hist]) => {
    const last = hist[hist.length - 1];
    bulan = last.month;
    return { nama, harga: rp(last.price), jenis: "non-subsidi" };
  });

  return {
    berlaku: `${bulan} (Jabodetabek, per liter)`,
    pertamina: [
      ...SUBSIDI.map((s) => ({ ...s, harga: rp(s.harga) })),
      ...nonSubsidi,
    ],
    catatan: "Harga Pertamina dari data resmi terverifikasi (berita penyesuaian). Harga bisa beda antar wilayah (pajak daerah). Shell/BP/Vivo tidak tersedia: tak ada sumber data publik legal (hanya via scraping situs = di luar prinsip jangkau).",
    sumber: "dataset bbm-predictor (github.com/ryanda9910/bbm-predictor)",
  };
}

export async function check() {
  const d = await fetchJson(SRC, { timeout: 10000 });
  const turbo = d["Pertamax Turbo (RON 98)"];
  if (!turbo?.length) throw new Error("format berubah");
  return `Pertamax Turbo ${rp(turbo[turbo.length - 1].price)} (${turbo[turbo.length - 1].month})`;
}
