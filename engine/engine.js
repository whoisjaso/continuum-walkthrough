// Pure-time engine. Every pixel is a function of t, so any frame renders identically, in any order, on any worker.
// Paste into the page's <script> (or <script src="engine.js">). Then write ONE function: seek(t, tf).
const AR = new URLSearchParams(location.search).get('ar') === 'h' ? 'h' : 'v';   // v = 1080x1920, h = 1920x1080
const $ = (id) => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
// Spring step response. z = 1 critically damped (no wobble), 0.88–0.95 a hair of overshoot. w = stiffness (bigger = faster).
function step(tau, w = 22, z = 0.9) {
  if (tau <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
}
// Keyframed value: track([[0, startValue], [t1, v1, w?, z?], [t2, v2], ...])(t). Each key springs from the previous.
function track(keys, w0 = 22, z0 = 0.9) {
  return (t) => { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * step(t - keys[i][0], keys[i][2] ?? w0, keys[i][3] ?? z0); return v; };
}
const sm = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };       // smoothstep a→b
const vis = (t, a, b = Infinity, w = 20) => step(t - a, w, 1) * (1 - step(t - b, w * 1.3, 1));           // in at a, out at b (fully)
const bl = (k, px) => (k > 0.004 ? `blur(${Math.max(0, k) * px}px)` : 'none');
const press = (t, at) => 1 - 0.1 * (sm(at - 0.08, at, t) - sm(at + 0.02, at + 0.16, t));                  // button dip on a tap
// Place an element by its CENTRE. Hidden (not just transparent) below 0.3% opacity, so nothing lingers.
// For SVGs/images whose size the browser misreports, set el._w / el._h yourself before the first call.
function setT(el, x, y, s = 1, o = 1, blur = 0) {
  const w = el._w ?? (el._w = el.offsetWidth), h = el._h ?? (el._h = el.offsetHeight);
  el.style.transform = `translate(${x - w / 2}px,${y - h / 2}px) scale(${s})`;
  el.style.opacity = clamp(o, 0, 1);
  el.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
  el.style.visibility = o < 0.003 ? 'hidden' : 'visible';
}
// Cross-fade the two children of el at time ts (text/label swaps).
function swap(el, t, ts) {
  const [a, b] = el.children, ka = sm(ts - 0.04, ts + 0.14, t), kb = sm(ts, ts + 0.2, t);
  a.style.opacity = 1 - ka; a.style.filter = `blur(${ka * 8}px)`; a.style.transform = `translateY(${-ka * 18}px)`;
  b.style.opacity = kb; b.style.filter = `blur(${(1 - kb) * 8}px)`; b.style.transform = `translateY(${(1 - kb) * 18}px)`;
}
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
// RULE (ghost_audit gate): an exit is ALWAYS to opacity 0. Never "park" a finished thing at 20–50% as background.
