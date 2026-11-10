// Shared Playwright loader: uses `playwright-core` from node_modules, or PW_DIR (a folder whose node_modules has it).
// Browser: CHROME=<path to chrome / chrome-headless-shell>, else Playwright's own Chromium.
import { createRequire } from 'node:module'; import path from 'node:path';
export function loadChromium() {
  const tries = [process.env.PW_DIR && path.join(process.env.PW_DIR, 'package.json'), path.join(process.cwd(), 'package.json'), import.meta.url];
  for (const t of tries.filter(Boolean)) {
    try { return createRequire(t)('playwright-core').chromium; } catch {}
    try { return createRequire(t)('playwright').chromium; } catch {}
  }
  throw new Error('playwright-core not found: run `npm i playwright-core` here, or set PW_DIR to a folder that has it');
}
export const launch = (chromium) => chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--font-render-hinting=none'] });
