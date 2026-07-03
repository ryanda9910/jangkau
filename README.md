# 🇮🇩 jangkau

**Beri agent AI kamu akses data publik Indonesia — satu perintah.**

Agent AI (Claude Code, Cursor, OpenClaw, apa pun yang bisa jalanin CLI) jago nulis kode, tapi buta soal Indonesia:

- 🌋 "Barusan gempa di mana?" → tidak tahu cara baca BMKG
- ⛅ "Cuaca di Jasinga hari ini?" → BMKG cuma terima kode desa 10 digit, agent mana tahu
- 📰 "Berita nasional hari ini apa?" → tidak tahu feed RSS resmi mana yang hidup
- 🗺️ "Kode BPS kecamatan ini berapa? Kode posnya?" → data tersebar, formatnya aneh
- 💱 "Kurs dolar sekarang?" / 📈 "BBCA berapa?" → tidak tahu sumber gratis yang legal
- 📊 "Cari data inflasi resmi" → tidak tahu data.go.id dan BPS WebAPI itu ada

`jangkau` membereskan semuanya: **9 kanal data publik Indonesia** — sumber resmi (BMKG, RSS media, ECB, Portal Satu Data, BPS) atau open-data komunitas (kodewilayah, emsifa, sooluh) dan endpoint publik Yahoo Finance — semuanya legal, plain GET, output selalu JSON rapi yang enak dibaca agent. Tanpa scraping login, tanpa risiko ban akun, tanpa API berbayar.

## Instal (suruh agent kamu yang pasang)

Copy satu baris ini ke agent AI kamu:

```
Pasang jangkau untukku: https://raw.githubusercontent.com/ryanda9910/jangkau/main/docs/install.md
```

Atau manual:

```bash
git clone https://github.com/ryanda9910/jangkau.git && cd jangkau && npm link
jangkau doctor
```

Butuh Node.js ≥ 18. Zero dependency — tidak ada `node_modules`.

## Kanal

| Kanal | Perintah | Sumber |
|---|---|---|
| 🌋 Gempa | `jangkau gempa` / `--m5` / `--dirasakan` | BMKG (open JSON) |
| ⛅ Cuaca | `jangkau cuaca jasinga bogor` | BMKG (level desa, kode diresolve otomatis) |
| 📰 Berita | `jangkau berita [kata kunci]` | RSS resmi Antara + CNN Indonesia + Tempo |
| 🗺️ Wilayah | `jangkau wilayah bogor` | Kode BPS (provinsi→desa) |
| 📮 Kode pos | `jangkau kodepos jasinga` | + koordinat |
| 💱 Kurs | `jangkau kurs EUR IDR` | ECB via Frankfurter |
| 📈 Saham IDX | `jangkau saham BBCA` | Yahoo Finance (data, bukan rekomendasi) |
| 📊 Dataset | `jangkau data inflasi` | Portal Satu Data (data.go.id) |
| 📉 Statistik | `jangkau bps inflasi` | BPS WebAPI (key gratis, 1 menit daftar) |

## Yang membedakan: router yang belajar sendiri

Tiap kanal punya daftar backend berurutan (utama + cadangan). Bedanya dari capability-layer lain: **jangkau ingat hasilnya**.

- Setiap panggilan dicatat dengan hasilnya (sukses/gagal + error) ke `~/.jangkau/learn.jsonl`
- Router mengurutkan backend berdasar tingkat sukses NYATA di mesin/jaringan kamu (`~/.jangkau/memory.json`)
- 1-dari-10 run tetap mencoba urutan asli (epsilon-explore) — backend yang pulih bisa merebut posisinya lagi
- `jangkau learn` menunjukkan apa yang sudah dipelajari; `jangkau doctor` menunjukkan kanal mana yang hidup sekarang

Contoh nyata: Yahoo Finance memblokir IP datacenter tapi lolos di IP rumahan — router kamu akan belajar mana host yang jalan *di tempat kamu*, bukan di README.

## Untuk agent: SKILL.md

`jangkau skill --install` memasang skill file ke `.claude/skills/jangkau/` di project aktif, jadi agent tahu kapan dan bagaimana memakai tiap kanal (termasuk aturannya: data saham ≠ rekomendasi, error → doctor dulu, dst).

## Prinsip

1. **Legal saja.** Semua sumber = API/feed publik (resmi pemerintah/media, atau open-data komunitas). Tidak ada login-cookie scraping, tidak ada bypass WAF/captcha, tidak ada risiko ban. Kanal yang butuh itu (marketplace, media sosial login) tidak akan pernah masuk.
2. **Glue, bukan wrapper tebal.** Panggil sumber langsung, normalisasi seperlunya, JSON keluar.
3. **Jujur soal kesehatan.** `doctor` mengetes endpoint beneran (bukan cuma "terkonfigurasi"), dan WAF pemerintah memang moody — makanya ada router yang belajar.

## Roadmap

- `peraturan` (JDIH) + `putusan` (Mahkamah Agung) — endpoint publiknya di balik WAF anti-bot; butuh riset per-sumber yang sopan sebelum layak rilis
- `bmkg iklim` (indeks UV, kualitas udara), `tsunami` warning feed
- Kanal usulan? Buka issue — kriteria: sumber resmi, legal, tanpa login.

## Lisensi

MIT — © Aldo Ryanda
