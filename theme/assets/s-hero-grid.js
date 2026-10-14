/* Hero: the holographic sticker catches the light as the pointer moves across the hero. */
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-motion')) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let raf = 0, x = .5, y = .5;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    x = (e.clientX - r.left) / r.width; y = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; hero.style.setProperty('--mx', x.toFixed(3)); hero.style.setProperty('--my', y.toFixed(3)); hero.classList.add('is-pointing'); });
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', .5); hero.style.setProperty('--my', .5); });
})();
