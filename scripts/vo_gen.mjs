// ElevenLabs voiceover, one file per line, trimmed, mono 48 kHz WAV.
// usage: node vo_gen.mjs <script.json> <out_dir> [take=1] [only=a01,a04]
// key:   ELEVENLABS_API_KEY env, or ELEVENLABS_KEY_FILE=<path to a file holding only the key>. Never print it, never commit it.
// script.json: { "voice": "<voice_id>", "model": "eleven_v4", "stability": 0.45, "lines": [{ "id": "a01", "text": "[casual] Hey..." }] }
// Free plan: 10,000 credits/month ≈ 10,000 characters. A 60 s walkthrough ≈ 900 chars, so 2 takes of everything ≈ 1,800.
//   FREE PLAN = NO COMMERCIAL LICENCE (ElevenLabs terms). Fine for drafts/internal; anything posted as marketing needs a
//   paid plan (Starter) at the time of generation. Regenerate the final takes on the paid plan before posting.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path';
const [, , scriptPath, outDir, take = '1', onlyArg] = process.argv;
const key = (process.env.ELEVENLABS_API_KEY || (process.env.ELEVENLABS_KEY_FILE ? readFileSync(process.env.ELEVENLABS_KEY_FILE, 'utf8') : '')).trim();
if (!key) { console.error('no key: set ELEVENLABS_API_KEY or ELEVENLABS_KEY_FILE'); process.exit(2); }
const S = JSON.parse(readFileSync(scriptPath, 'utf8')); mkdirSync(outDir, { recursive: true });
const only = onlyArg ? onlyArg.split(',') : null; let chars = 0;
for (const l of S.lines) {
  if (only && !only.includes(l.id)) continue;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${S.voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: l.text, model_id: S.model || 'eleven_v4', voice_settings: { stability: S.stability ?? 0.45, similarity_boost: 0.8 } }) });
  if (!r.ok) { console.log(l.id, 'HTTP', r.status, (await r.text()).slice(0, 200)); continue; }
  chars += l.text.length;
  const raw = path.join(outDir, `${l.id}-t${take}-raw.mp3`), out = path.join(outDir, `${l.id}-t${take}.wav`);
  writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', '-ac', '1', '-ar', '48000', out]);
  rmSync(raw);
  const d = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString();
  console.log(l.id, `t${take}`, d.toFixed(2) + 's');
}
console.log('characters billed ≈', chars);
