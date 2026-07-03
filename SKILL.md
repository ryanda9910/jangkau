---
name: jangkau
description: Akses data publik Indonesia dari CLI — gempa & cuaca BMKG, berita nasional (RSS resmi), wilayah administratif + kode pos, kurs IDR, harga saham IDX, dataset pemerintah, statistik BPS. Pakai saat user bertanya soal gempa, cuaca kota Indonesia, berita Indonesia, kode wilayah/pos, kurs rupiah, harga saham IDX, atau data/statistik pemerintah Indonesia.
---

# jangkau — data publik Indonesia untuk agent

Semua perintah mengembalikan JSON rapi. Semua sumber = API/feed publik legal (resmi: BMKG, RSS media, ECB, data.go.id, BPS; open-data komunitas: kodewilayah, emsifa, sooluh; endpoint publik Yahoo Finance). Tidak ada scraping login, tidak ada risiko ban akun.

## Perintah

| Kebutuhan | Perintah |
|---|---|
| Gempa terbaru | `jangkau gempa` (terkini), `--m5` (M5+), `--dirasakan`, `--tsunami` (hanya yg berpotensi tsunami) |
| Kualitas udara | `jangkau udara <kota>` (AQI + PM2.5/PM10; Open-Meteo tanpa key, WAQI opsional via `--waqi <token>`) |
| Cuaca desa/kecamatan | `jangkau cuaca <desa/kec> [kabupaten]` — contoh `jangkau cuaca jasinga bogor` |
| Berita nasional | `jangkau berita` atau `jangkau berita <kata kunci> --limit 5` |
| Kode wilayah BPS | `jangkau wilayah <nama>` |
| Kode pos + koordinat | `jangkau kodepos <nama tempat>` |
| Kurs rupiah | `jangkau kurs` (USD→IDR) atau `jangkau kurs EUR IDR` |
| Saham IDX | `jangkau saham BBCA` (data, bukan rekomendasi) |
| Dataset pemerintah | `jangkau data <kata kunci>` |
| Statistik BPS | `jangkau bps <kata kunci>` (sekali saja: daftar key gratis di webapi.bps.go.id lalu `jangkau bps --key <KEY>`) |
| Baca 1 post sosial | `jangkau sosial <url>` (oEmbed resmi; TikTok/YouTube tanpa key, IG/FB perlu Meta token) |

## Diagnosa & belajar

- `jangkau doctor` — cek live semua kanal (mana hidup, mana mati, berapa ms).
- `jangkau learn` — laporan router self-learning: backend mana yang andal/gagal di mesin ini. Router otomatis memprioritaskan backend yang terbukti jalan (memori di `~/.jangkau/memory.json`); kamu tidak perlu melakukan apa pun.

## Aturan untuk agent

1. Kalau sebuah kanal error, jalankan `jangkau doctor` dulu sebelum menyimpulkan — bedakan "endpoint mati" vs "salah pemakaian".
2. Data saham/kurs = DATA MENTAH, bukan rekomendasi investasi — jangan menyusun saran beli/jual darinya.
3. `jangkau bps` butuh key gratis; kalau belum ada, minta user daftar di webapi.bps.go.id (1 menit), jangan cari jalan pintas.
4. Semua output JSON — parse langsung, jangan regex teks bebasnya.
5. `jangkau sosial` hanya baca 1 URL post publik via oEmbed resmi — JANGAN pernah minta/pakai cookie login untuk scan feed/DM/follower. Kalau user minta itu, tolak: langgar ToS + risiko ban akun.
