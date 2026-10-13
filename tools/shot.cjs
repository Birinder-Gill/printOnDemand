// node shot.cjs in.html out.png W H [scale] [transparent]
// Renders a local HTML file to PNG at W x H CSS px (device scale factor `scale`).
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const [, , html, out, W, H, scale = '1', transparent = '0'] = process.argv;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +scale });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.text().startsWith('LOG')) errs.push(m.text()); });
  await p.goto('file://' + html, { waitUntil: 'load' });
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForFunction(() => window.__ready !== false, null, { timeout: 600000 });
  await p.screenshot({ path: out, omitBackground: transparent === '1', fullPage: false });
  if (errs.length) console.log(errs.join('\n'));
  await b.close();
})();
