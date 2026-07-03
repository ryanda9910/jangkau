// doa — doa harian + Asmaul Husna (myQuran, no key). Vertical islami.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "doa",
  description: "Doa harian & Asmaul Husna (myQuran)",
  tier: 0,
  backends: ["myquran"],
  usage: "jangkau doa [--husna]  (doa acak, atau salah satu Asmaul Husna)",
};

export async function run(args) {
  const husna = args.includes("--husna");
  const { result } = await runChannel(husna ? "doa:husna" : "doa:doa", {
    [husna ? "husna" : "doa"]: async () => {
      if (husna) {
        const d = await fetchJson("https://api.myquran.com/v2/husna/acak");
        const h = d.data;
        if (!h?.arab) throw new Error("format berubah");
        return { jenis: "Asmaul Husna", nomor: h.id, arab: h.arab, latin: h.latin, arti: h.indo };
      }
      const d = await fetchJson("https://api.myquran.com/v2/doa/acak");
      const a = d.data;
      if (!a?.doa) throw new Error("format berubah");
      return { jenis: "Doa", judul: a.judul || "", arab: a.doa, latin: a.latin || "", arti: a.artinya || a.indo || "" };
    },
  });
  return result;
}

export async function check() {
  const d = await fetchJson("https://api.myquran.com/v2/husna/1", { timeout: 8000 });
  if (!d.data?.arab && !d.data?.[0]?.arab) throw new Error("format berubah");
  return "Asmaul Husna OK";
}
