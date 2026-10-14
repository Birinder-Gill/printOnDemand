/* Product main: gallery in the bubble, swipe, zoom, quantity counter, variant price and the phone buy bar. */
(() => {
  const root = document.querySelector('.pm');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-slide]')];
  const thumbs = [...root.querySelectorAll('[data-go]')];
  const count = root.querySelector('[data-count]');
  let cur = 0;
  function show(i, focusThumb) {
    if (!slides.length) return;
    i = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.hidden = k !== i; s.classList.toggle('is-on', k === i); if (k === i) { s.classList.remove('is-in'); void s.offsetWidth; s.classList.add('is-in'); const img = s.querySelector('img'); if (img) img.loading = 'eager'; } });
    thumbs.forEach((t, k) => t.setAttribute('aria-current', String(k === i)));
    if (count) count.textContent = i + 1;
    if (focusThumb && thumbs[i]) { thumbs[i].focus(); thumbs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    cur = i;
  }
  root.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { show(+g.dataset.go); return; }
    const s = e.target.closest('[data-step]'); if (s) { show(cur + (+s.dataset.step)); return; }
    const q = e.target.closest('[data-q]');
    if (q) { const n = root.querySelector('.pm__qnum'); n.value = Math.max(1, Math.min(99, (+n.value || 1) + (+q.dataset.q))); return; }
  });
  root.querySelector('.pm__thumbs')?.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
  });
  // swipe on the bubble
  const bubble = root.querySelector('.pm__bubble');
  let x0 = null;
  bubble?.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  bubble?.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  // zoom
  const lb = root.querySelector('[data-lightbox]');
  root.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (!z || !lb) return;
    const img = z.querySelector('img');
    const big = lb.querySelector('[data-lb-img]');
    big.src = (img.currentSrc || img.src).replace(/width=\d+/, 'width=2048'); big.alt = img.alt;
    lb.showModal ? lb.showModal() : lb.setAttribute('open', '');
  });
  lb?.addEventListener('click', e => { if (e.target === lb || e.target.closest('[data-lb-close]')) lb.close(); });
  // variant price
  const sel = root.querySelector('[data-variant-select]');
  sel?.addEventListener('change', () => {
    const o = sel.selectedOptions[0];
    root.querySelector('input[name=id]').value = sel.value;
    root.querySelectorAll('[data-price]').forEach(p => { p.textContent = o.dataset.price; });
  });
  // phone buy bar: shows once the main button has scrolled away
  const sticky = root.querySelector('[data-sticky]');
  const main = root.querySelector('[data-main-add]');
  if (sticky && main && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { sticky.hidden = en.isIntersecting || en.boundingClientRect.top > 0; }).observe(main);
  }
})();
