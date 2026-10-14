/* Cheat codes: enter up up down down left right left right B A, on the pad or the keyboard. */
(() => {
  const root = document.querySelector('[data-cheats]');
  if (!root) return;
  const code = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  const btns = [...root.querySelectorAll('[data-code]')];
  const status = root.querySelector('[data-status]');
  const win = root.querySelector('[data-win]');
  const hint = status ? status.textContent : '';
  let pos = 0, timer = 0;
  const keymap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', b: 'b', B: 'b', a: 'a', A: 'a' };

  function light() { btns.forEach((b, i) => b.classList.toggle('is-lit', i < pos)); }
  function reset(msg) {
    pos = 0; light();
    if (status) { status.textContent = msg || hint; status.classList.toggle('is-bad', !!msg); }
  }
  function press(k) {
    if (k === code[pos]) {
      pos++; light();
      if (status) { status.classList.remove('is-bad'); status.textContent = `${pos} of ${code.length}`; }
      if (pos === code.length) celebrate();
    } else {
      reset(k === code[0] ? null : 'Not quite. Start again from the top.');
      if (k === code[0]) { pos = 1; light(); }
    }
    clearTimeout(timer);
    timer = setTimeout(() => { if (pos && pos < code.length) reset(); }, 6000);
  }
  function celebrate() {
    if (status) status.textContent = root.querySelector('.cc__win-t')?.textContent || 'Cheat activated!';
    if (win) {
      win.hidden = false;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => { win.hidden = true; reset(); }, reduced ? 2500 : 3600);
    }
  }
  root.addEventListener('click', e => { const b = e.target.closest('[data-code]'); if (b) press(b.dataset.code); });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const k = keymap[e.key];
    if (!k) return;
    const r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;  // only while the section is on screen
    press(k);
  });
})();
