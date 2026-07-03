// data — Portal Satu Data Indonesia (data.go.id) CKAN search.
// The CKAN endpoint is WAF-moody: it works from some networks and blocks
// others. That is exactly what doctor + the learned router are for — the
// channel stays declared, health is measured, and failures are remembered.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "data",
  description: "Dataset pemerintah (Portal Satu Data / data.go.id)",
  tier: 0,
  backends: ["ckan-katalog"],
  usage: "jangkau data <kata kunci>",
};

export async function run(args) {
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih kata kunci: jangkau data inflasi");
  const { result } = await runChannel("data", {
    "ckan-katalog": async () => {
      const d = await fetchJson(`https://katalog.data.go.id/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=8`, { timeout: 20000 });
      if (!d.success) throw new Error("CKAN error");
      return d.result.results.map((r) => ({
        judul: r.title,
        instansi: r.organization?.title || "",
        update: r.metadata_modified?.slice(0, 10),
        format: [...new Set((r.resources || []).map((x) => x.format))].join(","),
        link: `https://data.go.id/dataset/${r.name}`,
      }));
    },
  });
  return result;
}

export async function check() {
  const d = await fetchJson("https://katalog.data.go.id/api/3/action/package_search?rows=1", { timeout: 12000 });
  if (!d.success) throw new Error("CKAN error");
  return `${d.result.count} dataset terindeks`;
}
