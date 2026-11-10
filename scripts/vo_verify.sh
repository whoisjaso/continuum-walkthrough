#!/bin/zsh
# Verify every take says exactly its line, and get word timings to place picture events on words.
# usage: zsh vo_verify.sh <vo_dir> <whisper_model.bin>      (whisper.cpp: brew install whisper-cpp; model ggml-small.en-q5_1.bin)
# Prints each take's transcript; writes <take>.words.csv (start_ms,end_ms,word) next to each WAV.
# Pick the take that (1) matches the script word for word, (2) has the best read. Reject any take with an added/missing word.
D="$1"; M="$2"
for f in "$D"/*-t*.wav; do
  b="${f:r}"
  whisper-cli -ng -m "$M" -f "$f" -ml 1 -ocsv -of "$b.words" -np >/dev/null 2>&1
  printf '%-14s %s\n' "${f:t:r}" "$(whisper-cli -ng -m "$M" -f "$f" -nt -np 2>/dev/null | tr -s ' \n' ' ')"
done
