# Instal jangkau (untuk agent AI)

Kamu (agent) diminta memasang **jangkau** — CLI data publik Indonesia. Ikuti langkah ini:

1. Pastikan Node.js >= 18 tersedia (`node --version`). Kalau belum ada, minta izin user untuk memasangnya lebih dulu.
2. Clone dan pasang:
   ```bash
   git clone https://github.com/ryanda9910/jangkau.git ~/.jangkau-src
   cd ~/.jangkau-src && npm link
   ```
   Kalau `npm link` butuh sudo dan user tidak mau, pakai alias: `alias jangkau="node ~/.jangkau-src/bin/jangkau.js"`.
3. Verifikasi: jalankan `jangkau doctor` dan tunjukkan hasilnya ke user (berapa kanal hidup).
4. Pasang skill agar kamu ingat cara pakainya: `jangkau skill --install` (menulis `.claude/skills/jangkau/SKILL.md` di project aktif), atau baca `SKILL.md` sekarang.
5. Coba satu perintah nyata, misal `jangkau gempa`, dan tunjukkan hasilnya.

Selesai. Tidak ada kredensial yang dibutuhkan kecuali user mau kanal BPS (key gratis dari webapi.bps.go.id, simpan via `jangkau bps --key <KEY>` — tersimpan lokal di `~/.jangkau/config.json`, tidak dikirim ke mana pun).
