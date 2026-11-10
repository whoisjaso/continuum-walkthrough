#!/usr/bin/env python3
"""Cue-sheet mixer for a walkthrough. usage: python3 mix.py cues.json
Voice leads (-16 LUFS), SFX -21 (ducked ~3.5 dB under speech), music bed -23 (ducked 6 dB under speech).
Writes tmp/audio/vo_music.wav and tmp/audio/vo_sfx.wav, each at -14 LUFS integrated, -1 dBFS peak.

cues.json:
{ "len": 58, "sfx_dir": "~/path/to/sfx/",           # every file below is relative to sfx_dir
  "music": {"file": "music/bed.mp3", "offset": 37.72},  # optional; path relative to cues.json
  "vo": [["vo/raw/a01-t1.wav", 0.75], ...],          # [take, start_s]; asserted non-overlapping
  "typing": [{"from": 14.29, "to": 15.29, "files": ["pack5/typing_2.wav", "ios/ios_key.wav"], "gain": -24}],
  "sfx": [[0.5, "ios/ios_tritone.wav", -11], ...] }   # [time_s, file, gain_dB]; the sound's PEAK lands on time_s
"""
import json, os, random, subprocess, sys
import numpy as np
SR = 48000
cfg_path = sys.argv[1]; base = os.path.dirname(os.path.abspath(cfg_path)); C = json.load(open(cfg_path))
LEN = float(C['len']); N = int(LEN * SR); SFX = os.path.expanduser(C['sfx_dir'])
os.makedirs('tmp/audio', exist_ok=True); TMP = 'tmp/audio/_m.f32'

def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
def peak(x):
    m = np.abs(x).mean(1); w = int(SR * 0.005); return int(np.argmax(np.convolve(m, np.ones(w) / w, 'same')))
def lufs(x):
    x.astype(np.float32).tofile(TMP)
    o = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', TMP, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float([l for l in o.splitlines() if l.strip().startswith('I:')][-1].split()[1])

random.seed(7); ev = [tuple(e) for e in C.get('sfx', [])]
for ty in C.get('typing', []):                      # randomised key clicks for on-screen typing
    t = ty['from']
    while t < ty['to'] - 0.05:
        ev.append((round(t, 3), random.choice(ty['files']), ty.get('gain', -24) + random.uniform(-2, 2))); t += random.uniform(0.09, 0.15)
fx = np.zeros((N, 2), np.float32); cache = {}
for t, f, g in ev:
    if f not in cache: x = load(os.path.join(SFX, f)); cache[f] = (x, peak(x))
    x, pk = cache[f]; s = int(t * SR) - pk; a = max(0, s); b = min(N, s + len(x))
    if b > a: fx[a:b] += x[a - s:b - s] * 10 ** (g / 20)
print('placed', len(ev), 'sounds')

vo = np.zeros((N, 2), np.float32); gate = np.zeros(N, np.float32); spans = []
for f, at in C['vo']:
    x = load(os.path.join(base, f)); fd = int(0.01 * SR); x[:fd] *= np.linspace(0, 1, fd)[:, None]; x[-fd:] *= np.linspace(1, 0, fd)[:, None]
    s = int(at * SR); e = min(N, s + len(x)); vo[s:e] += x[:e - s]; gate[s:e] = 1; spans.append((f, at, round(at + len(x) / SR, 2)))
for a, b in zip(spans, spans[1:]): assert a[2] <= b[1] + 0.01, ('voice lines overlap', a, b)
print('voice', [(os.path.basename(s[0]), s[1], s[2]) for s in spans])

k = int(0.3 * SR); duck = np.clip(np.convolve(gate, np.ones(k) / k, 'same') * 1.8, 0, 1)[:, None]
vo *= 10 ** ((-16 - lufs(vo)) / 20); fx *= 10 ** ((-21 - lufs(fx)) / 20); fxg = fx * (1 - 0.33 * duck)
outs = [('vo_sfx', vo + fxg)]
if C.get('music'):
    off = float(C['music'].get('offset', 0)); music = load(os.path.join(base, C['music']['file']))[int(off * SR):int(off * SR) + N]
    if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
    fi = int(0.02 * SR); music[:fi] *= np.linspace(0, 1, fi)[:, None]; fo = int(3.0 * SR); music[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    music *= 10 ** ((-23 - lufs(music)) / 20); outs.insert(0, ('vo_music', vo + fxg + music * (1 - 0.5 * duck)))
for name, m in outs:
    for _ in range(3):   # normalise → limit, converge on -14 LUFS / -1 dBFS
        m = m * 10 ** ((-14 - lufs(m)) / 20); m.astype(np.float32).tofile(TMP)
        m = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', TMP, '-af', 'alimiter=limit=0.891:attack=2:release=60:level=false', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).reshape(-1, 2).copy()
    m.astype(np.float32).tofile(TMP)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', TMP, '-ar', '48000', f'tmp/audio/{name}.wav'], check=True)
    print(name, 'LUFS', round(lufs(m), 1), 'peak dBFS', round(20 * np.log10(np.abs(m).max()), 1))
os.remove(TMP); print('ok')
