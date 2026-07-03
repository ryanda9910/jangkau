#!/usr/bin/env bash
# Smoke test: every channel command runs against the LIVE endpoint and must
# return valid JSON (or a clean documented error for tier-1 without key).
set -uo pipefail
cd "$(dirname "$0")"
J="node bin/jangkau.js"
pass=0; fail=0

check() { # name, command, expect-substring
  local name="$1"; shift
  local expect="$1"; shift
  out=$("$@" 2>&1)
  if echo "$out" | grep -q "$expect"; then echo "  ✅ $name"; pass=$((pass+1));
  else echo "  ❌ $name — got: $(echo "$out" | head -c 120)"; fail=$((fail+1)); fi
}

echo "jangkau smoke test (live endpoints)"
# expectations are QUOTED JSON KEYS (success shape) so an error message — which
# may contain channel names/URLs — can never satisfy a check (no false PASS)
check "gempa"    '"magnitudo"'  $J gempa
check "berita"   '"judul"'      $J berita --limit 3
check "berita-q" '"judul"\|^\[\]$' $J berita jakarta --limit 3
check "wilayah"  '"kode"'       $J wilayah bogor
check "kodepos"  '"kodepos"'    $J kodepos menteng
check "kurs"     '"kurs"'       $J kurs
check "saham"    '"harga"'      $J saham BBCA
check "cuaca"    '"lokasi"'     $J cuaca jasinga bogor
check "bps"      'webapi.bps.go.id\|"indikator"' $J bps inflasi
check "sosial-tt" '"platform"' $J sosial "https://www.tiktok.com/@scout2015/video/6718335390845095173"
check "sosial-yt" '"platform"' $J sosial "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
check "udara"    '"aqi"'        $J udara jakarta
check "tsunami"  '"potensi"\|"tsunami"' $J gempa --tsunami
check "doctor"   '[1-9][0-9]*/[0-9]* kanal hidup' $J doctor
check "learn"    'Refleksi\|belum ada trajektori' $J learn
check "help"     "Kanal"        $J help

echo ""
echo "$pass lulus, $fail gagal"
[ "$fail" -eq 0 ]
