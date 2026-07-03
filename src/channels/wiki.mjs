// wiki — ringkasan Wikipedia Bahasa Indonesia untuk sebuah topik (REST API, no key).
// Beri agent pengetahuan ensiklopedis berbahasa Indonesia dari satu query.
import { fetchJson, fetchText, runChannel } from "../core.mjs";

export const meta = {
  name: "wiki",
  description: "Ringkasan Wikipedia Bahasa Indonesia",
  tier: 0,
  backends: ["rest-summary", "search"],
  usage: "jangkau wiki <topik>",
};

const API = "https://id.wikipedia.org";

export async function run(args) {
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih topik: jangkau wiki soekarno");
  const { result } = await runChannel("wiki", {
    "rest-summary": async () => {
      const d = await fetchJson(`${API}/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, "_"))}`);
      if (d.type === "disambiguation" || !d.extract) throw new Error("bukan artikel tunggal");
      return d;
    },
    // fallback: resolve the query via opensearch, then summary of the top hit
    search: async () => {
      const s = await fetchJson(`${API}/w/api.php?action=opensearch&limit=1&format=json&search=${encodeURIComponent(q)}`);
      const title = s?.[1]?.[0];
      if (!title) throw new Error(`tidak ketemu: ${q}`);
      const d = await fetchJson(`${API}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
      if (!d.extract) throw new Error("tidak ada ringkasan");
      return d;
    },
  });
  return {
    judul: result.title,
    ringkasan: result.extract,
    url: result.content_urls?.desktop?.page || `${API}/wiki/${encodeURIComponent(result.title)}`,
    thumbnail: result.thumbnail?.source || "",
  };
}

export async function check() {
  const d = await fetchJson(`${API}/api/rest_v1/page/summary/Indonesia`, { timeout: 8000 });
  if (!d.extract) throw new Error("format berubah");
  return `contoh "Indonesia": ${d.extract.slice(0, 40)}…`;
}
