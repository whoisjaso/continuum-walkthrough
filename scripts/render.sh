#!/bin/zsh
# Restart-proof full render of both formats + mux with both mixes. Run DETACHED, or a server/app restart kills it:
#   nohup zsh render.sh <project_dir> <page.html> <len_s> "<out_dir>" "<Name vX>" > render.log 2>&1 < /dev/null & disown
# Expects <project_dir>/tmp/audio/vo_music.wav and vo_sfx.wav (from mix.py). Writes 4 MP4s into <out_dir>.
set -e
HERE="${0:A:h}"; cd "$1"; export PAGE="$2" LEN="$3"; O="$4"; NAME="$5"
mkdir -p tmp/render "$O"
echo "$(date +%T) start"
for a in v h; do
  n=$([ $a = v ] && echo "9x16" || echo "16x9")
  node "$HERE/render.mjs" full $a tmp/render/$a.mp4 4 2>&1 | grep -v "^\s*at " | tail -3
  f=$(ffprobe -v error -count_frames -show_entries stream=nb_read_frames -of csv=p=0 tmp/render/$a.mp4)
  echo "$a frames $f (want $(( LEN * 60 )))"
  ffmpeg -v error -y -i tmp/render/$a.mp4 -i tmp/audio/vo_music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest "$O/$NAME $n Voice With Music.mp4"
  ffmpeg -v error -y -i tmp/render/$a.mp4 -i tmp/audio/vo_sfx.wav   -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest "$O/$NAME $n Voice SFX Only.mp4"
  rm -f tmp/render/$a.mp4
  echo "$(date +%T) $a done"
done
ls "$O"; df -h / | tail -1
echo ALLDONE
