// berita — Indonesian national news via official RSS feeds, multi-source.
// Sources are independent backends: one dead feed never kills the channel,
// and the learned router deprioritizes feeds that keep failing on your network.
import { fetchText, parseRss, runChannel } from "../core.mjs";

export const meta = {
  name: "berita",
  description: "Berita nasional (RSS resmi: Antara, CNN Indonesia, Tempo)",
  tier: 0,
  backends: ["antara", "cnnindonesia", "tempo"],
  usage: "jangkau berita [kata kunci] [--limit N]",
};

const FEEDS = {
  antara: "https://www.antaranews.com/rss/terkini.xml",
  cnnindonesia: "https://www.cnnindonesia.com/nasional/rss",
  tempo: "https://rss.tempo.co/",
};

export async function run(args) {
  const limIdx = args.indexOf("--limit");
  const limit = limIdx > -1 ? parseInt(args[limIdx + 1], 10) || 10 : 10;
  const q = args.filter((a, i) => !a.startsWith("--") && (limIdx < 0 || i !== limIdx + 1)).join(" ").toLowerCase();

  // aggregate: try every source, tolerate partial failure, but log each outcome
  const all = [];
  const errors = [];
  for (const src of Object.keys(FEEDS)) {
    try {
      const { result } = await runChannel(`berita:${src}`, { [src]: async () => parseRss(await fetchText(FEEDS[src])) });
      for (const item of result) all.push({ sumber: src, ...item });
    } catch (e) { errors.push(`${src}: ${e.message}`); }
  }
  if (!all.length) throw new Error(`semua sumber berita gagal — ${errors.join("; ")}`);
  const filtered = q ? all.filter((i) => (i.title + " " + i.description).toLowerCase().includes(q)) : all;
  filtered.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  return filtered.slice(0, limit).map(({ sumber, title, link, pubDate }) => ({ sumber, judul: title, link, waktu: pubDate }));
}

export async function check() {
  const xml = await fetchText(FEEDS.antara, { timeout: 8000 });
  const n = parseRss(xml).length;
  if (!n) throw new Error("feed kosong");
  return `antara ${n} item`;
}
