// kurs — exchange rates vs IDR (Frankfurter, ECB reference data, no key).
// Two hosts of the same service = real fallback pair.
import { fetchJson, runChannel } from "../core.mjs";

export const meta = {
  name: "kurs",
  description: "Kurs mata uang thd IDR (data ECB via Frankfurter)",
  tier: 0,
  backends: ["frankfurter-dev", "frankfurter-app"],
  usage: "jangkau kurs [DARI] [KE]  (default: USD IDR)",
};

export async function run(args) {
  const w = args.filter((a) => !a.startsWith("--")).map((s) => s.toUpperCase());
  const from = w[0] || "USD";
  const to = w[1] || "IDR";
  const { result, backend } = await runChannel("kurs", {
    "frankfurter-dev": () => fetchJson(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`),
    "frankfurter-app": () => fetchJson(`https://api.frankfurter.app/latest?from=${from}&to=${to}`),
  });
  return { tanggal: result.date, kurs: `1 ${from} = ${result.rates[to]?.toLocaleString("id-ID")} ${to}`, sumber: `ECB (${backend})` };
}

export async function check() {
  const d = await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR", { timeout: 8000 });
  if (!d.rates?.IDR) throw new Error("format berubah");
  return `USD/IDR ${d.rates.IDR}`;
}
