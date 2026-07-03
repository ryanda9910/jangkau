// hijriah — Gregorian↔Hijri date conversion (myQuran calendar, no key).
// Default: today (WIB). Optional date arg YYYY-MM-DD.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "hijriah",
  description: "Tanggal Hijriah (konversi dari Masehi)",
  tier: 0,
  backends: ["myquran"],
  usage: "jangkau hijriah [YYYY-MM-DD]",
};

export async function run(args) {
  const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const date = dateArg || today;
  const { result } = await runChannel("hijriah", {
    myquran: async () => {
      const d = await fetchJson(`https://api.myquran.com/v2/cal/hijr/${date}/?adj=-1`);
      if (!d.data?.date) throw new Error("format berubah");
      return d.data;
    },
  });
  return {
    masehi: result.date[2],
    hari: result.date[0],
    hijriah: result.date[1],
  };
}

export async function check() {
  const d = await fetchJson("https://api.myquran.com/v2/cal/hijr/2026-07-04/?adj=-1", { timeout: 8000 });
  if (!d.data?.date?.[1]) throw new Error("format berubah");
  return `4 Jul 2026 = ${d.data.date[1]}`;
}
