// bps — BPS (Statistics Indonesia) WebAPI. Tier 1: needs a free API key from
// webapi.bps.go.id (register, instant). Key stored locally in ~/.jangkau/config.json.
import { fetchJson, runChannel, loadConfig, saveConfig } from "../core.mjs";

export const meta = {
  name: "bps",
  description: "Statistik resmi BPS (perlu key gratis webapi.bps.go.id)",
  tier: 1,
  backends: ["webapi"],
  usage: "jangkau bps <kata kunci>  |  jangkau bps --key <API_KEY>",
};

export async function run(args) {
  const ki = args.indexOf("--key");
  if (ki > -1) {
    const cfg = loadConfig();
    cfg.bps_key = args[ki + 1];
    saveConfig(cfg);
    return { ok: "key BPS tersimpan di ~/.jangkau/config.json" };
  }
  const key = loadConfig().bps_key || process.env.BPS_KEY;
  if (!key) throw new Error("perlu key gratis: daftar di https://webapi.bps.go.id lalu `jangkau bps --key <KEY>`");
  const q = args.filter((a) => !a.startsWith("--")).join(" ");
  if (!q) throw new Error("kasih kata kunci: jangkau bps inflasi");
  const { result } = await runChannel("bps", {
    webapi: async () => {
      const d = await fetchJson(`https://webapi.bps.go.id/v1/api/list/model/indicators/domain/0000/keyword/${encodeURIComponent(q)}/key/${key}/`, { timeout: 20000 });
      if (d.status !== "OK") throw new Error(d.message || "BPS API error");
      return (d.data?.[1] || []).slice(0, 10).map((r) => ({ id: r.indicator_id ?? r.var_id, indikator: r.title ?? r.name, unit: r.unit || "" }));
    },
  });
  return result;
}

export async function check() {
  const key = loadConfig().bps_key || process.env.BPS_KEY;
  if (!key) throw Object.assign(new Error("belum ada key (gratis: webapi.bps.go.id → `jangkau bps --key <KEY>`)"), { warn: true });
  const d = await fetchJson(`https://webapi.bps.go.id/v1/api/domain/type/all/key/${key}/`, { timeout: 12000 });
  if (d.status !== "OK") throw new Error(d.message || "key ditolak");
  return "key valid";
}
