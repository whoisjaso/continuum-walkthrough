// GATE: nothing may be "parked" half-visible. Seeks the page every 0.25 s and flags any element that sits at
// 0.03–0.5 effective opacity (or is visible but blurred > 2 px) for longer than MAX seconds. That is the
// "silhouette the entire time after 0:18" bug (PO Desk v4, Jason 2026-11-09): windows shrank to 25% and never left.
// usage: node ghost_audit.mjs <page.html> <len_s> [v|h] [max_s=3]  (deliberate dims, e.g. other notifications while one is tapped, run < 2.5 s)   → exit 1 on any ghost
import path from 'node:path'; import { loadChromium, launch } from './pw.mjs';
const [, , page, lenArg, ar = 'v', maxArg = '3'] = process.argv;
const LEN = Number(lenArg), MAX = Number(maxArg), DT = 0.25;
const VW = ar === 'h' ? 1920 : 1080, VH = ar === 'h' ? 1080 : 1920;
const browser = await launch(loadChromium());
const p = await browser.newPage({ viewport: { width: VW, height: VH } });
await p.goto('file://' + path.resolve(page) + '?ar=' + ar); await p.waitForFunction(() => window.READY);
const streaks = new Map(), ghosts = [];
for (let t = 0; t <= LEN + 1e-6; t += DT) {
  const hits = await p.evaluate((t) => {
    seek(t, t); const out = [], area = innerWidth * innerHeight;
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < area * 0.01) continue;           // ignore tiny bits
      if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
      let o = 1, blur = 0, n = el, hidden = false;
      for (; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') { hidden = true; break; }
        o *= +cs.opacity; const m = /blur\(([\d.]+)px\)/.exec(cs.filter); if (m) blur = Math.max(blur, +m[1]);
      }
      if (hidden || o < 0.03) continue;
      if (o < 0.5 || blur > 2) out.push({ id: el.id || el.className || el.tagName, o: +o.toFixed(2), blur: +blur.toFixed(1) });
    }
    return out;
  }, t);
  const now = new Set();
  for (const h of hits) { now.add(h.id); const s = streaks.get(h.id) || { from: t, o: h.o, blur: h.blur }; streaks.set(h.id, s); }
  for (const [id, s] of streaks) if (!now.has(id)) { if (t - s.from > MAX) ghosts.push({ id, from: s.from, to: t, ...s }); streaks.delete(id); }
}
for (const [id, s] of streaks) if (LEN - s.from > MAX) ghosts.push({ id, from: s.from, to: LEN, ...s });
await browser.close();
const top = new Map(); for (const g of ghosts) if (!top.has(g.id) || g.to - g.from > top.get(g.id).to - top.get(g.id).from) top.set(g.id, g);
if (!top.size) { console.log(`PASS ghost_audit ${ar}: nothing parked half-visible > ${MAX}s`); process.exit(0); }
console.log(`FAIL ghost_audit ${ar}: ${top.size} element(s) parked half-visible`);
for (const g of [...top.values()].slice(0, 15)) console.log(`  ${String(g.id).slice(0, 40).padEnd(40)} ${g.from.toFixed(2)}s → ${g.to.toFixed(2)}s  opacity ${g.o}  blur ${g.blur}px`);
process.exit(1);
