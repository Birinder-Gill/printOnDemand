/* Inside the book: pick a tape off the shelf and it opens at the rental counter (a native dialog). */
(() => {
  const root = document.querySelector('[data-vs]');
  if (!root) return;
  const dlg = root.querySelector('[data-rent]');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const q = s => dlg.querySelector(s);
  let opener = null;
  root.addEventListener('click', e => {
    const t = e.target.closest('.vhs');
    if (!t) return;
    const d = t.dataset;
    opener = t;
    const img = q('[data-rent-img]');
    img.src = d.img; img.alt = `Puzzle ${d.no}: ${d.title}`;
    q('[data-rent-no]').textContent = `Puzzle No. ${d.no} · page ${d.page}`;
    q('[data-rent-title]').textContent = d.title;
    q('[data-rent-category]').textContent = d.category;
    q('[data-rent-section]').textContent = d.section;
    q('[data-rent-side]').textContent = d.side;
    q('[data-rent-clues]').textContent = d.clues;
    q('[data-rent-hints]').textContent = d.hints === '0' ? 'None' : d.hints;
    q('[data-rent-note]').textContent = d.note;
    dlg.showModal();
    document.documentElement.classList.add('no-scroll');
  });
  const close = () => dlg.close();
  q('[data-rent-close]').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('no-scroll'); opener && opener.focus(); });
})();
