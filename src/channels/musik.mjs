// musik — top chart Indonesia (lagu, album, podcast) via Apple/iTunes RSS resmi,
// tanpa key. Charts adalah data ID nyata (Apple Music Indonesia storefront).
// Spotify butuh OAuth + chart-nya SPA; iTunes RSS = jalur publik legal.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "musik",
  description: "Top chart Indonesia: lagu/album/podcast (Apple Music)",
  tier: 0,
  backends: ["itunes-id"],
  usage: "jangkau musik [lagu|album|podcast] [--limit N]",
};

const KIND = { lagu: "topsongs", album: "topalbums", podcast: "toppodcasts" };

export async function run(args) {
  const li = args.indexOf("--limit");
  const limit = li > -1 ? parseInt(args[li + 1], 10) || 10 : 10;
  const which = args.find((a) => KIND[a?.toLowerCase()]) || "lagu";
  const feed = KIND[which.toLowerCase()];

  const { result } = await runChannel("musik", {
    "itunes-id": async () => {
      const d = await fetchJson(`https://itunes.apple.com/id/rss/${feed}/limit=${Math.min(limit, 100)}/json`, { timeout: 12000 });
      const entries = d.feed?.entry;
      if (!entries?.length) throw new Error("chart kosong");
      return entries;
    },
  });
  return {
    chart: which.toLowerCase(),
    sumber: "Apple Music Indonesia",
    top: result.slice(0, limit).map((x, i) => ({
      peringkat: i + 1,
      judul: x["im:name"]?.label,
      artis: x["im:artist"]?.label || "",
      kategori: x.category?.attributes?.label || "",
    })),
  };
}

export async function check() {
  const d = await fetchJson("https://itunes.apple.com/id/rss/topsongs/limit=1/json", { timeout: 10000 });
  const top = d.feed?.entry?.[0];
  if (!top?.["im:name"]?.label) throw new Error("format berubah");
  return `#1 lagu ID: ${top["im:name"].label} — ${top["im:artist"]?.label || ""}`;
}
