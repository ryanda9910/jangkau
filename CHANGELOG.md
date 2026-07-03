# Changelog

Semua perubahan penting jangkau. Format longgar ala [Keep a Changelog], tanggal WIB.

## [0.2.0] - 2026-07-04

Ekspansi besar: 9 → 18 kanal, plus loop harness self-improving.

### Ditambahkan
- **Kanal islami** (demand tertinggi di Indonesia): `sholat` (jadwal per kota, myQuran), `quran` (surah + ayat arab/latin/terjemahan/audio), `hijriah` (konversi Masehi→Hijriah), `doa` (doa harian & Asmaul Husna).
- **Kanal pasar**: `ihsg` (indeks IHSG + LQ45 bursa Indonesia).
- **Kanal sosial**: `sosial` (baca 1 post publik via oEmbed resmi — TikTok/YouTube tanpa key, IG/FB via Meta token; per-URL saja, bukan scraping feed).
- **Kanal lingkungan**: `udara` (kualitas udara + AQI + PM2.5, Open-Meteo).
- **Kanal unik**: `pesawat` (pesawat live di wilayah udara Indonesia, OpenSky realtime), `wiki` (ringkasan Wikipedia Bahasa Indonesia).
- **`gempa --tsunami`** (filter gempa berpotensi tsunami) + **`gempa --live`** (feed INATEWS ~30 gempa terakhir, backend fallback).
- **Loop harness self-improving** (`jangkau tune`): doctor (maker) → verify (checker independen) → reflect (learner) → memory, cadence-able. Router makin cepat karena belajar backend mana yang andal di jaringanmu.

### Diperbaiki
- `quran` surah: field API (`name_id`/`name_short`) bukan yang diasumsikan.
- `sholat`/`hijriah` default tanggal: WIB (Asia/Jakarta), bukan UTC — "hari ini" akurat untuk pengguna Indonesia.
- `cuaca`: BMKG pakai kode KEMENDAGRI (Permendagri 72/2019), bukan kode BPS.

### Ditahan (diprobe, endpoint belum layak)
- `peraturan`/`putusan` (JDIH/MA): di balik WAF anti-bot — butuh circumvention, di luar prinsip.
- `pangan` (Badan Pangan): API tolak koneksi eksternal.
- Global-only (crypto/emas spot): sengaja tidak masuk — jangkau khusus data Indonesia.

## [0.1.0] - 2026-07-03

Rilis awal: 9 kanal + self-learning backend router.

### Ditambahkan
- Kanal: `gempa`, `cuaca` (BMKG), `berita` (RSS resmi), `wilayah`, `kodepos`, `kurs` (ECB), `saham` (IDX), `data` (Portal Satu Data), `bps` (WebAPI, key gratis).
- **Self-learning router**: tiap panggilan backend dicatat dengan hasilnya (`~/.jangkau/learn.jsonl`), urutan backend mengikuti tingkat sukses nyata di mesin pengguna (`~/.jangkau/memory.json`, epsilon 0.1).
- `doctor` (health check live), `learn` (laporan router), `skill --install`.
- Zero dependency, Node ≥18, MIT.
