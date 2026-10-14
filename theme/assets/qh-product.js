/* Product gallery (scroll-snap slides + thumbnails + arrows) and the phone buy bar. */
(() => {
  const g = document.querySelector('[data-qgallery]');
  if (g) {
    const track = g.querySelector('[data-qslides]');
    const slides = [...g.querySelectorAll('[data-qslide]')];
    const thumbs = [...g.querySelectorAll('[data-qgo]')];
    const count = g.querySelector('[data-qcount]');
    let cur = 0;
    const pad = n => String(n).padStart(2, '0');
    const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    const mark = i => {
      cur = i;
      thumbs.forEach((t, k) => t.setAttribute('aria-current', k === i ? 'true' : 'false'));
      if (count) count.textContent = pad(i + 1);
    };
    const go = i => {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[n].offsetLeft, behavior: smooth() });
      mark(n);
    };
    thumbs.forEach(t => t.addEventListener('click', () => go(+t.dataset.qgo)));
    g.querySelectorAll('[data-qstep]').forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.qstep)));
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== cur && slides[i]) mark(i);
      });
    }, { passive: true });
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    document.addEventListener('variant:change', e => {
      const id = e.detail && e.detail.media;
      if (!id) return;
      const k = slides.findIndex(s => s.dataset.mediaId === String(id));
      if (k > -1) go(k);
    });
  }

  const bar = document.querySelector('[data-qbar]');
  const add = document.querySelector('.qpm__add');
  if (bar && add && 'IntersectionObserver' in window) {
    bar.hidden = false;
    const io = new IntersectionObserver(([en]) => bar.classList.toggle('is-on', !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(add);
  }
})();
