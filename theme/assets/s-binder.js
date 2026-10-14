/* Card binder: page tabs, page turns, holo glint under the pointer, and the display case dialog. */
(() => {
  const root = document.querySelector('[data-binder]');
  if (!root) return;
  const sheets = [...root.querySelectorAll('[data-sheet]')];
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const cards = [...root.querySelectorAll('[data-card]')].sort((a, b) => a.dataset.card - b.dataset.card);
  const dialog = root.querySelector('[data-case]');
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-motion');
  let page = 0, cur = 0;

  function show(i, focus) {
    i = Math.max(0, Math.min(sheets.length - 1, i));
    if (i === page && !focus) return;
    const dir = i >= page ? 1 : -1;
    sheets.forEach((s, k) => {
      s.hidden = k !== i;
      s.classList.toggle('is-on', k === i);
      s.classList.remove('is-in', 'is-in-back');
      if (k === i && !reduced()) { void s.offsetWidth; s.classList.add(dir > 0 ? 'is-in' : 'is-in-back'); }
    });
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    page = i;
    if (focus) tabs[i].focus();
  }
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { show(+t.dataset.tab); return; }
    const turn = e.target.closest('[data-turn]'); if (turn) { show(page + (+turn.dataset.turn)); return; }
    const c = e.target.closest('[data-card]'); if (c && !c.closest('[data-case]')) { open(+c.dataset.card); return; }
    const o = e.target.closest('[data-open]'); if (o) { open(+o.dataset.open); }
  });
  root.querySelector('.bd__tabs')?.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(page + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(page - 1, true); }
  });

  // holo glint follows the pointer across a card
  if (window.matchMedia('(hover: hover)').matches) {
    root.addEventListener('pointermove', e => {
      const c = e.target.closest('.card'); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width).toFixed(3));
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height).toFixed(3));
    });
  }

  // ---- display case ----
  if (!dialog) return;
  const $ = s => dialog.querySelector(s);
  const set = (sel, v) => dialog.querySelectorAll(sel).forEach(el => { el.textContent = v; });
  const cardEl = $('[data-case-card]');
  const flip = $('[data-case-flip]');
  let opener = null;
  function fill(i) {
    cur = (i + cards.length) % cards.length;
    const d = cards[cur].dataset;
    const img = $('[data-case-img]');
    img.src = d.img; img.alt = `${d.title}, the book page`;
    set('[data-case-code]', d.code); set('[data-case-title]', d.title); set('[data-case-title2]', d.title);
    set('[data-case-cat]', d.category); set('[data-case-cat2]', d.category); set('[data-case-section]', d.section);
    set('[data-case-clues]', d.clues); set('[data-case-hints]', d.hints); set('[data-case-note]', d.note); set('[data-case-note2]', d.note);
    set('[data-case-no2]', d.no); set('[data-case-clues2]', d.clues || '—'); set('[data-case-hints2]', d.hints || '—');
    set('[data-case-page2]', d.page || '—'); set('[data-case-side2]', d.side || '—');
    dialog.querySelectorAll('[data-case-hide]').forEach(el => { el.hidden = !d.clues; });
    cardEl.classList.remove('is-flipped'); flip.setAttribute('aria-pressed', 'false');
    const li = root.querySelector(`[data-open="${cur}"]`); li && li.classList.add('is-seen');
    // keep the binder on the card's page
    const sheet = cards[cur].closest('[data-sheet]'); if (sheet) show(+sheet.dataset.sheet);
  }
  function open(i) {
    opener = document.activeElement;
    fill(i);
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    document.documentElement.classList.add('no-scroll');
  }
  function close() { dialog.close ? dialog.close() : dialog.removeAttribute('open'); }
  dialog.addEventListener('close', () => { document.documentElement.classList.remove('no-scroll'); const c = cards[cur]; (c || opener)?.focus(); });
  dialog.addEventListener('click', e => {
    if (e.target === dialog) { close(); return; }
    if (e.target.closest('[data-case-close]')) { close(); return; }
    const s = e.target.closest('[data-case-step]'); if (s) { fill(cur + (+s.dataset.caseStep)); return; }
    if (e.target.closest('[data-case-flip]') || e.target.closest('[data-case-card]')) {
      const on = !cardEl.classList.contains('is-flipped');
      cardEl.classList.toggle('is-flipped', on); flip.setAttribute('aria-pressed', String(on));
    }
  });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); fill(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); fill(cur - 1); }
  });
})();
