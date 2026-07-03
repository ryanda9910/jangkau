# vhs assets/demo.tape — live e2e demo: real endpoints, real Indonesian data.
# Kept tight (one screen per command) so the whole GIF stays watchable.
Output assets/demo.gif
Set FontSize 15
Set Width 1000
Set Height 640
Set Theme "Catppuccin Mocha"
Set TypingSpeed 32ms
Set Shell "bash"

# isolate router state; show the help header once as an intro
Hide
Type "export HOME=/tmp/jangkau-demo && mkdir -p $HOME && clear"
Enter
Show
Type "# jangkau — data publik Indonesia untuk agent AI"
Enter
Sleep 1.5s
Type "clear"
Enter

# gempa (BMKG, realtime)
Type "jangkau gempa"
Enter
Sleep 3s
Type "clear"
Enter

# sholat (islami, demand tertinggi)
Type "jangkau sholat jakarta"
Enter
Sleep 3s
Type "clear"
Enter

# quran (arab + terjemahan + audio)
Type "jangkau quran 1 1"
Enter
Sleep 3s
Type "clear"
Enter

# pesawat live — fitur paling unik (OpenSky, di langit Indonesia)
Type "jangkau pesawat --limit 4"
Enter
Sleep 3.5s
Type "clear"
Enter

# saham IDX
Type "jangkau saham BBCA"
Enter
Sleep 3s
Type "clear"
Enter

# udara / AQI
Type "jangkau udara jakarta"
Enter
Sleep 3s
Type "clear"
Enter

# doctor — health check semua kanal (live)
Type "jangkau doctor"
Enter
Sleep 5s
Type "clear"
Enter

# tune — loop self-improving (pembeda: router belajar sendiri)
Type "jangkau tune"
Enter
Sleep 5s
