// jangkau CLI — data publik Indonesia untuk agent AI.
import { CHANNELS } from "./channels/index.mjs";
import { doctor } from "./doctor.mjs";
import { learnReport } from "./learn.mjs";
import { tune } from "./tune.mjs";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, ...args] = process.argv.slice(2);

function help() {
  const lines = ["jangkau — beri agent AI kamu data publik Indonesia", "", "Kanal:"];
  for (const ch of Object.values(CHANNELS)) lines.push(`  ${ch.meta.usage.padEnd(46)} ${ch.meta.description}`);
  lines.push(
    "",
    "Perintah lain:",
    "  jangkau doctor                                 cek kesehatan semua kanal (live)",
    "  jangkau learn                                  laporan belajar router (backend andal/gagal)",
    "  jangkau tune                                   loop self-improving (maker→checker→reflect); flag kanal menurun",
    "  jangkau skill [--install]                      tampilkan / pasang SKILL.md ke .claude/skills",
    "",
    "Output selalu JSON rapi — langsung enak dibaca agent."
  );
  console.log(lines.join("\n"));
}

async function main() {
  if (!cmd || cmd === "help" || cmd === "--help") return help();
  if (cmd === "doctor") return console.log(await doctor());
  if (cmd === "learn") return console.log(learnReport());
  if (cmd === "tune") {
    const { text, verdict } = await tune();
    console.log(text);
    process.exit(verdict);
  }
  if (cmd === "version" || cmd === "--version") {
    return console.log(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version);
  }
  if (cmd === "skill") {
    const skillPath = join(ROOT, "SKILL.md");
    if (args.includes("--install")) {
      const dest = join(process.cwd(), ".claude", "skills", "jangkau");
      mkdirSync(dest, { recursive: true });
      writeFileSync(join(dest, "SKILL.md"), readFileSync(skillPath, "utf8"));
      return console.log(`terpasang: ${join(dest, "SKILL.md")}`);
    }
    return console.log(existsSync(skillPath) ? readFileSync(skillPath, "utf8") : "SKILL.md tidak ketemu");
  }
  const ch = CHANNELS[cmd];
  if (!ch) {
    console.error(`kanal tidak dikenal: ${cmd}\n`);
    help();
    process.exit(1);
  }
  try {
    const out = await ch.run(args);
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ error: e.message }, null, 2));
    process.exit(1);
  }
}

main();
