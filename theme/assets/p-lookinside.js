/* Look inside: turn pages with a 3D leaf; click, keys, swipe; preload the neighbours. */
(() => {
  const root = document.querySelector('[data-flip]');
  if (!root) return;
  const tpls = [...root.querySelectorAll('[data-spread]')];
  if (!tpls.length) return;
  const book = root.querySelector('[data-book]');
  const L = root.querySelector('.li__page--l'), R = root.querySelector('.li__page--r');
  const leaf = root.querySelector('.li__leaf'), front = leaf.querySelector('.li__leaf-f'), back = leaf.querySelector('.li__leaf-b');
  const counter = root.querySelector('[data-counter]'), cap = root.querySelector('[data-caption-out]');
  const small = window.matchMedia('(max-width: 700px)').matches;
  const src = i => small ? tpls[i].dataset.srcS : tpls[i].dataset.src;
  const url = i => `url("${src(i)}")`;
  const loaded = new Set();
  const preload = i => { if (i < 0 || i >= tpls.length || loaded.has(i)) return; loaded.add(i); const im = new Image(); im.src = src(i); };
  let cur = 0, busy = false;
  const set = (el, i) => el.style.setProperty('--img', url(i));
  const info = i => { counter.textContent = String(i + 1).padStart(3, '0'); cap.textContent = tpls[i].dataset.caption; };
  set(L, 0); set(R, 0); preload(0); preload(1);

  function turn(dir) {
    const to = cur + dir;
    if (busy || to < 0 || to >= tpls.length) return;
    busy = true; preload(to + dir);
    if (dir > 0) {
      front.style.backgroundImage = url(cur); back.style.backgroundImage = url(to);
      set(R, to);                                   // under the turning leaf: the next right page
      leaf.className = 'li__leaf is-next';
    } else {
      front.style.backgroundImage = url(cur); back.style.backgroundImage = url(to);
      set(L, to);
      leaf.className = 'li__leaf is-prev';
    }
    const done = () => { set(L, to); set(R, to); leaf.className = 'li__leaf'; cur = to; info(cur); busy = false; };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) done(); else leaf.addEventListener('animationend', done, { once: true });
  }
  root.addEventListener('click', e => { const t = e.target.closest('[data-turn]'); if (t) turn(+t.dataset.turn); });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
  });
  let x0 = null;
  book.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) turn(dx < 0 ? 1 : -1); x0 = null; });
})();
