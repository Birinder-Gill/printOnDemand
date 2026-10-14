/* Channel lineup: the remote changes the channel, with a burst of static, the on-screen display and the glow. */
(() => {
  const root = document.querySelector('[data-channels]');
  if (!root) return;
  const tv = root.querySelector('[data-tv]');
  const screens = [...root.querySelectorAll('.tvset__ch')];
  const guides = [...root.querySelectorAll('[data-guide]')];
  const keys = [...root.querySelectorAll('[data-go]')];
  const osdCh = root.querySelector('[data-osd-ch]');
  const osdName = root.querySelector('[data-osd-name]');
  const canvas = root.querySelector('.tvset__static');
  const ctx = canvas && canvas.getContext('2d');
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-motion');
  const data = keys.map(k => ({ label: k.getAttribute('aria-label') }));
  let cur = 0, nameTimer = 0, staticRaf = 0;

  // warm up the next screens once the section is close, so channel changes don't wait on the network
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      screens.forEach(s => { const img = s.querySelector('img'); if (img) img.loading = 'eager'; });
    }, { rootMargin: '600px' });
    io.observe(root);
  }

  function noise(ms) {
    if (!ctx) return;
    const w = canvas.width, h = canvas.height, img = ctx.createImageData(w, h), d = img.data;
    const t0 = performance.now();
    cancelAnimationFrame(staticRaf);
    const frame = now => {
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255 | 0;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      // a rolling bright band, like a tuner hunting for the signal
      const band = ((now - t0) / ms * h * 1.6) % h | 0;
      for (let y = band; y < Math.min(h, band + 10); y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = Math.min(255, d[i] + 90); }
      ctx.putImageData(img, 0, 0);
      if (now - t0 < ms) staticRaf = requestAnimationFrame(frame);
    };
    staticRaf = requestAnimationFrame(frame);
  }

  function go(i, focusKey) {
    const n = screens.length;
    i = (i + n) % n;
    if (i === cur) return;
    cur = i;
    const fast = reduced();
    if (!fast) { tv.classList.add('is-switching'); noise(380); }
    const swap = () => {
      screens.forEach((s, k) => s.classList.toggle('is-on', k === i));
      guides.forEach((g, k) => { g.hidden = k !== i; if (k === i) { g.classList.remove('is-in'); void g.offsetWidth; g.classList.add('is-in'); } });
      keys.forEach((k, j) => k.setAttribute('aria-pressed', String(j === i)));
      const fig = screens[i];
      const num = (keys[i].getAttribute('aria-label').match(/Channel (\S+),/) || [])[1];
      if (osdCh && num) osdCh.textContent = num;
      if (osdName) osdName.textContent = (keys[i].getAttribute('aria-label').split(', ').slice(1).join(', ')) || '';
      if (fig && fig.dataset.glow) root.style.setProperty('--glow', fig.dataset.glow);
      tv.classList.add('show-name');
      clearTimeout(nameTimer);
      nameTimer = setTimeout(() => tv.classList.remove('show-name'), 2600);
    };
    if (fast) swap(); else setTimeout(swap, 170);
    setTimeout(() => tv.classList.remove('is-switching'), fast ? 0 : 420);
    if (focusKey) keys[i].focus();
  }

  root.addEventListener('click', e => {
    const k = e.target.closest('[data-go]');
    if (k) { go(+k.dataset.go); return; }
    const s = e.target.closest('[data-step]');
    if (s) go(cur + (+s.dataset.step));
  });
  root.addEventListener('keydown', e => {
    if (!e.target.closest('.remote')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); go(cur + 1, true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); go(cur - 1, true); }
    if (/^[1-9]$/.test(e.key) && +e.key <= screens.length) { e.preventDefault(); go(+e.key - 1, true); }
  });
})();
