// node shots.cjs <page> <width> [outPrefix] [--full] [--h=900] [--slice=1800] [--y=0] [--hover=sel] [--click=sel] [--wait=ms] [--reduced]
// Screenshots http://127.0.0.1:8777/<page>.html; full-page shots are cut into slices out_1.png, out_2.png ...
const { chromium, exe } = require('../pw.cjs');
const { execFileSync } = require('child_process');
(async () => {
  const a = process.argv.slice(2);
  const page = a[0], W = +a[1], out = a[2] && !a[2].startsWith('--') ? a[2] : `/home/claude/work/shots/${page}-${W}`;
  const opt = k => { const m = a.find(x => x.startsWith(`--${k}=`)); return m ? m.split('=').slice(1).join('=') : null; };
  const full = a.includes('--full');
  const H = +(opt('h') || (W < 600 ? 844 : 900));
  require('fs').mkdirSync(require('path').dirname(out), { recursive: true });
  const b = await chromium.launch({ ...exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: +(opt('dpr') || 1), reducedMotion: a.includes('--reduced') ? 'reduce' : 'no-preference', hasTouch: W < 600 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('requestfailed', r => errs.push('FAILED ' + r.url()));
  p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errs.push(r.status() + ' ' + r.url()); });
  await p.goto(`http://127.0.0.1:8777/${page}.html`, { waitUntil: 'networkidle', timeout: 120000 });
  await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.evaluate(async () => { await document.fonts.ready; });
  if (opt('click')) for (const s of opt('click').split('|')) { await p.click(s).catch(e => errs.push('click ' + s + ' ' + e.message.split('\n')[0])); await p.waitForTimeout(400); }
  if (opt('hover')) await p.hover(opt('hover')).catch(() => {});
  if (opt('eval')) { await p.evaluate(opt('eval')); await p.waitForTimeout(700); }
  await p.waitForTimeout(+(opt('wait') || 1500));
  if (opt('y')) { await p.evaluate(y => window.scrollTo(0, y), +opt('y')); await p.waitForTimeout(800); await p.evaluate(async () => { await Promise.all([...document.images].filter(i => i.offsetParent && i.getBoundingClientRect().top < innerHeight * 2).map(i => i.complete ? i.decode().catch(()=>{}) : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); }); await p.waitForTimeout(400); }
  if (a.includes('--sections')) {
    await p.addStyleTag({ content: '.sct-header,.sct-ticker{position:static!important}.skip-link{display:none!important}' });
    const n = await p.evaluate(() => document.querySelectorAll('main > .shopify-section, body > .shopify-section').length);
    const els = await p.$$('main > .shopify-section, footer, body > .shopify-section.sct-footer');
    let k = 0;
    for (const el of els) {
      k++;
      await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
      await p.evaluate(async () => { await Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? i.decode().catch(()=>{}) : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); });
      const box = await el.boundingBox();
      if (!box || box.height < 5) continue;
      await el.screenshot({ path: `${out}_s${k}.png` });
      console.log(`${out}_s${k}.png`, Math.round(box.height));
    }
  } else if (full) {
    // trigger lazy content by scrolling through
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.evaluate(async () => { await Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? i.decode().catch(()=>{}) : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); }))); });
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
    await p.screenshot({ path: out + '.png', fullPage: true });
    const slice = +(opt('slice') || 1800);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('${out}.png'); W,H=im.size; s=${slice}; n=0
for y in range(0,H,s):
    n+=1; im.crop((0,y,W,min(H,y+s))).save('${out}_%d.png'%n)
print('slices',n,'height',H)
`], { stdio: 'inherit' });
  } else {
    await p.screenshot({ path: out + '.png' });
  }
  if (errs.length) console.log(errs.slice(0, 20).join('\n'));
  await b.close();
})();
