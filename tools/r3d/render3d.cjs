// node render3d.cjs "query" out.png size [aspect]
const { chromium, exe } = require('../pw.cjs');
const fs = require('fs');
(async () => {
  const [, , q, out, size = '1600', aspect = '1'] = process.argv;
  const b = await chromium.launch({ ...exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const W = Math.round(+size * +aspect), H = +size;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto(`http://127.0.0.1:8765/r3d/book.html?${q}&size=${size}&aspect=${aspect}`, { waitUntil: 'domcontentloaded', timeout: 0 });
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 900000 });
  const data = await p.evaluate(() => window.__png);
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log(out, ((Date.now() - t0) / 1000).toFixed(1) + 's', errs.slice(0, 5).join(' | '));
  await b.close();
})();
