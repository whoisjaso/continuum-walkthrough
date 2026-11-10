// node render.mjs stills <v|h> <outdir> t1 t2 ...   |   node render.mjs full <v|h> <out.mp4> [workers=4]
// full: 60 fps, 8 subframes over a 180° shutter blended in ffmpeg (real motion blur), streamed (no frames on disk).
// env: PAGE (default walkthrough.html)  LEN (seconds, required for full)  CHROME / PW_DIR (see pw.mjs)
// The page must define seek(t, tf) and set window.READY = true when fonts/images are decoded.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import { loadChromium, launch } from './pw.mjs';
const [, , mode, ar, out, ...rest] = process.argv;
const VW = ar === 'h' ? 1920 : 1080, VH = ar === 'h' ? 1080 : 1920, FPS = 60, SUB = 8, SHUT = 0.5, LEN = Number(process.env.LEN || 0);
const url = 'file://' + path.resolve(process.env.PAGE || 'walkthrough.html') + '?ar=' + ar;
const browser = await launch(loadChromium());
const open = async () => { const p = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 }); await p.goto(url); await p.waitForFunction(() => window.READY); return p; };
if (mode === 'stills') {
  fs.mkdirSync(out, { recursive: true }); const p = await open();
  for (const t of rest.map(Number)) { await p.evaluate((t) => seek(t, t), t); await p.screenshot({ path: path.join(out, `${ar}-${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 80 }); }
} else {
  if (!LEN) throw new Error('set LEN=<seconds>');
  const N = LEN * FPS * SUB, W = Number(rest[0] || 4);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-c:v', 'png', '-i', '-',
    '-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB),format=yuv420p`, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const pages = await Promise.all(Array.from({ length: W }, open));
  const buf = new Map(); let next = 0, write = 0;
  const flush = async () => { while (buf.has(write)) { const b = buf.get(write); buf.delete(write); write++; if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); } };
  await Promise.all(pages.map(async (p) => {
    while (true) {
      const i = next++; if (i >= N) break;
      while (i - write > 400) await new Promise((r) => setTimeout(r, 20));
      const k = Math.floor(i / SUB), j = i % SUB, t = k / FPS + (j / SUB) * (SHUT / FPS);
      await p.evaluate(([t, tf]) => seek(t, tf), [t, k / FPS]);   // tf = frame time: things that must stay sharp use it
      buf.set(i, await p.screenshot({ type: 'png' })); await flush();
      if (i % 2400 === 0) console.log(ar, 'frame', k, '/', LEN * FPS);
    }
  }));
  await flush(); ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
await browser.close();
