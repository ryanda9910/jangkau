# 🇮🇩 jangkau

**Beri agent AI kamu akses data publik Indonesia — satu perintah.**

![demo jangkau: gempa, cuaca, saham, doctor, learn — live](assets/demo.gif)

Agent AI (Claude Code, Cursor, OpenClaw, apa pun yang bisa jalanin CLI) jago nulis kode, tapi buta soal Indonesia:

- 🌋 "Barusan gempa di mana?" → tidak tahu cara baca BMKG
- ⛅ "Cuaca di Jasinga hari ini?" → BMKG cuma terima kode desa 10 digit, agent mana tahu
- 📰 "Berita nasional hari ini apa?" → tidak tahu feed RSS resmi mana yang hidup
- 🗺️ "Kode BPS kecamatan ini berapa? Kode posnya?" → data tersebar, formatnya aneh
- 💱 "Kurs dolar sekarang?" / 📈 "BBCA berapa?" → tidak tahu sumber gratis yang legal
- 📊 "Cari data inflasi resmi" → tidak tahu data.go.id dan BPS WebAPI itu ada

`jangkau` membereskan semuanya: **18 kanal data publik Indonesia** — sumber resmi (BMKG, RSS media, ECB, Portal Satu Data, BPS) atau open-data komunitas (kodewilayah, emsifa, sooluh) dan endpoint publik Yahoo Finance — semuanya legal, plain GET, output selalu JSON rapi yang enak dibaca agent. Tanpa scraping login, tanpa risiko ban akun, tanpa API berbayar.

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
| 🌋 Gempa | `jangkau gempa` / `--m5` / `--dirasakan` / `--tsunami` / `--live` | BMKG TEWS + INATEWS |
| 💨 Kualitas udara | `jangkau udara jakarta` | Open-Meteo (tanpa key); WAQI stasiun darat opsional |
| ⛅ Cuaca | `jangkau cuaca jasinga bogor` | BMKG (level desa, kode diresolve otomatis) |
| 📰 Berita | `jangkau berita [kata kunci]` | RSS resmi Antara + CNN Indonesia + Tempo |
| 🗺️ Wilayah | `jangkau wilayah bogor` | Kode BPS (provinsi→desa) |
| 📮 Kode pos | `jangkau kodepos jasinga` | + koordinat |
| 💱 Kurs | `jangkau kurs EUR IDR` | ECB via Frankfurter |
| 📈 Saham IDX | `jangkau saham BBCA` | Yahoo Finance (data, bukan rekomendasi) |
| 📊 IHSG / LQ45 | `jangkau ihsg` / `jangkau ihsg lq45` | Indeks bursa Indonesia (data, bukan rekomendasi) |
| 🕌 Jadwal sholat | `jangkau sholat jakarta` | myQuran (per kota, level harian) |
| 📖 Al-Quran | `jangkau quran 1` / `jangkau quran 2 255` | myQuran (surah + ayat arab/terjemahan/audio) |
| 🌙 Hijriah | `jangkau hijriah` / `jangkau hijriah 2026-08-17` | Konversi Masehi→Hijriah (myQuran) |
| ✈️ Pesawat | `jangkau pesawat` | Pesawat live di wilayah udara Indonesia (OpenSky) |
| 🤲 Doa | `jangkau doa` / `jangkau doa --husna` | Doa harian & Asmaul Husna (myQuran) |
| 📚 Wiki | `jangkau wiki soekarno` | Ringkasan Wikipedia Bahasa Indonesia |
| 📊 Dataset | `jangkau data inflasi` | Portal Satu Data (data.go.id) |
| 📉 Statistik | `jangkau bps inflasi` | BPS WebAPI (key gratis, 1 menit daftar) |
| 📱 Sosial (1 URL) | `jangkau sosial <url>` | oEmbed resmi: TikTok + YouTube (tanpa key), IG + FB (perlu Meta app token) |

### Soal media sosial

`jangkau sosial` **hanya** membaca **satu** post publik yang kamu sudah punya URL-nya, lewat endpoint **oEmbed resmi** tiap platform. Tidak ada login, tidak ada cookie, tidak ada scraping feed, tidak ada risiko ban.

Yang **tidak** dilakukan (dan tidak akan pernah): scan/search timeline, baca DM, follower, atau apa pun yang butuh cookie login akun. Itu melanggar ToS dan bisa nge-ban akunmu — di luar prinsip jangkau. TikTok & YouTube jalan langsung; IG & Facebook butuh Meta app token (`jangkau sosial --meta <APP_ID> <APP_SECRET>`, atau env `META_APP_ID`/`META_APP_SECRET`).

## Yang membedakan: router yang belajar sendiri

Tiap kanal punya daftar backend berurutan (utama + cadangan). Bedanya dari capability-layer lain: **jangkau ingat hasilnya**.

- Setiap panggilan dicatat dengan hasilnya (sukses/gagal + error) ke `~/.jangkau/learn.jsonl`
- Router mengurutkan backend berdasar tingkat sukses NYATA di mesin/jaringan kamu (`~/.jangkau/memory.json`)
- 1-dari-10 run tetap mencoba urutan asli (epsilon-explore) — backend yang pulih bisa merebut posisinya lagi
- `jangkau learn` menunjukkan apa yang sudah dipelajari; `jangkau doctor` menunjukkan kanal mana yang hidup sekarang
- **`jangkau tune`** = loop self-improving (maker→checker→reflect): cek semua kanal live, grade independen (flag kanal yang dulu andal tapi kini menurun, abaikan gangguan sesaat spt rate-limit), lalu ringkas apa yang dipelajari router. Jalankan berkala (cron) atau manual. Exit non-nol kalau ada regresi — enak buat CI/monitoring.

Contoh nyata: Yahoo Finance memblokir IP datacenter tapi lolos di IP rumahan — router kamu akan belajar mana host yang jalan *di tempat kamu*, bukan di README.

## Untuk agent: SKILL.md

`jangkau skill --install` memasang skill file ke `.claude/skills/jangkau/` di project aktif, jadi agent tahu kapan dan bagaimana memakai tiap kanal (termasuk aturannya: data saham ≠ rekomendasi, error → doctor dulu, dst).

## Prinsip

1. **Legal saja.** Semua sumber = API/feed publik (resmi pemerintah/media, atau open-data komunitas). Tidak ada login-cookie scraping, tidak ada bypass WAF/captcha, tidak ada risiko ban. Kanal yang butuh itu (marketplace, media sosial login) tidak akan pernah masuk.
2. **Glue, bukan wrapper tebal.** Panggil sumber langsung, normalisasi seperlunya, JSON keluar.
3. **Jujur soal kesehatan.** `doctor` mengetes endpoint beneran (bukan cuma "terkonfigurasi"), dan WAF pemerintah memang moody — makanya ada router yang belajar.

## Roadmap

- `pangan` (harga pangan Badan Pangan RI) — API-nya (`api-panelhargav2.badanpangan.go.id`) menolak koneksi dari luar (bukan cuma WAF); ditahan sampai ada jalur resmi.
- `bmkg iklim` (indeks UV), pasang surut, siklon tropis — kalau ada endpoint publik JSON.
- Kanal usulan? Buka issue — kriteria: sumber resmi, legal, tanpa login, tanpa bypass WAF.

### Kenapa belum ada `peraturan` / `putusan`

Diprobe (2026-07): JDIH BPK (`peraturan.bpk.go.id`), JDIHN (`jdihn.go.id`), dan Direktori Putusan Mahkamah Agung (`putusan3.mahkamahagung.go.id`) semuanya menaruh endpoint **search di balik WAF anti-bot** — request programatik dapat `403`/timeout meski halaman depan bisa dibuka. Menembusnya butuh headless browser yang menyelesaikan challenge WAF, alias **circumvention**, yang di luar prinsip jangkau (sama dengan aturan "tanpa login-scraping"). Kalau BPK/JDIHN/MA merilis API resmi (mis. via Satu Data), kanal ini langsung dibangun. Sementara, sebagian peraturan bisa dicari lewat `jangkau data` (Portal Satu Data) bila instansinya mempublikasikan datasetnya di sana.

## Lisensi

MIT — © Aldo Ryanda
