// quran — Al-Quran: daftar/isi surah + ayat (arab, latin, terjemahan ID, audio).
// myQuran API, tanpa key. Salah satu query paling umum di Indonesia.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "quran",
  description: "Al-Quran: surah + ayat (arab, terjemahan ID, audio)",
  tier: 0,
  backends: ["myquran"],
  usage: "jangkau quran <no.surah> [no.ayat]  (contoh: quran 1  |  quran 2 255)",
};

const BASE = "https://api.myquran.com/v2";

export async function run(args) {
  const nums = args.filter((a) => /^\d+$/.test(a));
  const surah = nums[0];
  const ayat = nums[1];
  if (!surah) throw new Error("kasih nomor surah: jangkau quran 1 (opsional ayat: jangkau quran 2 255)");

  const { result } = await runChannel("quran", {
    myquran: async () => {
      if (ayat) {
        const d = await fetchJson(`${BASE}/quran/ayat/${surah}/${ayat}`);
        const a = d.data?.[0];
        if (!a) throw new Error("ayat tidak ada");
        return {
          surah: `${d.info?.surat?.nama?.id} (${surah})`,
          ayat: Number(ayat),
          arab: a.arab,
          latin: a.latin,
          terjemahan: a.text,
        };
      }
      const d = await fetchJson(`${BASE}/quran/surat/${surah}`);
      const s = d.data;
      if (!s) throw new Error("surah tidak ada");
      return {
        nomor: Number(s.number || surah),
        nama: `${s.name_id} (${s.name_short})`,
        arti: s.translation_id,
        jumlah_ayat: Number(s.number_of_verses),
        tempat_turun: s.revelation_id,
        tafsir: (s.tafsir || "").slice(0, 220),
        audio: s.audio_url,
        catatan: "baca ayat: jangkau quran " + surah + " <no.ayat>",
      };
    },
  });
  return result;
}

export async function check() {
  const d = await fetchJson(`${BASE}/quran/ayat/1/1`, { timeout: 8000 });
  if (!d.data?.[0]?.arab) throw new Error("format berubah");
  return `Al-Fatihah ayat 1 OK`;
}
