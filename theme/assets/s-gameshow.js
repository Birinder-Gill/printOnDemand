/* Game show: letter squares with auto-advance, lock it in, lifeline, reveal, scoreboard and the bulb chase. */
(() => {
  const root = document.querySelector('[data-gameshow]');
  if (!root) return;
  const marquee = root.querySelector('[data-bulbs]');
  const scoreEl = root.querySelector('[data-score]');
  const msgEl = root.querySelector('[data-msg]');
  const pods = [...root.querySelectorAll('[data-podium]')];
  const solved = new Set();
  const srEl = root.querySelector('[data-msg-sr]');
  const say = t => { if (msgEl) msgEl.textContent = t.toUpperCase().replace(/ /g, '!'); if (srEl) srEl.textContent = t; };

  pods.forEach((pod, idx) => {
    const sq = [...pod.querySelectorAll('.pod__sq')];
    const answer = atob(pod.dataset.key || '');
    const result = pod.querySelector('[data-result]');
    const hint = pod.querySelector('[data-hint]');
    const value = () => sq.map(i => (i.value || ' ').toUpperCase()).join('');

    sq.forEach((inp, i) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase();
        pod.classList.remove('is-wrong');
        if (inp.value && sq[i + 1]) sq[i + 1].focus();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && sq[i - 1]) { e.preventDefault(); sq[i - 1].value = ''; sq[i - 1].focus(); }
        if (e.key === 'ArrowLeft' && sq[i - 1]) { e.preventDefault(); sq[i - 1].focus(); }
        if (e.key === 'ArrowRight' && sq[i + 1]) { e.preventDefault(); sq[i + 1].focus(); }
      });
      inp.addEventListener('paste', e => {
        const t = (e.clipboardData.getData('text') || '').replace(/[^a-z]/gi, '').toUpperCase();
        if (!t) return;
        e.preventDefault();
        [...t].forEach((ch, k) => { if (sq[i + k]) sq[i + k].value = ch; });
        (sq[Math.min(sq.length - 1, i + t.length)] || inp).focus();
      });
      inp.addEventListener('focus', () => inp.select());
    });

    pod.addEventListener('submit', e => {
      e.preventDefault();
      const v = value();
      if (v.includes(' ')) { result.textContent = `Fill all ${sq.length} squares first.`; sq.find(i => !i.value)?.focus(); return; }
      if (v === answer) {
        pod.classList.remove('is-wrong'); pod.classList.add('is-right');
        result.textContent = `That's right! ${pod.dataset.ok || ''}`;
        if (!solved.has(idx) && !pod.classList.contains('is-revealed')) { solved.add(idx); }
        scoreEl.textContent = solved.size;
        say(solved.size === pods.length ? 'Perfect score' : 'Correct');
        if (marquee) { marquee.classList.remove('is-chasing'); void marquee.offsetWidth; marquee.classList.add('is-chasing'); }
        sq.forEach(i => { i.readOnly = true; });
      } else {
        pod.classList.remove('is-wrong'); void pod.offsetWidth; pod.classList.add('is-wrong');
        result.textContent = hint.hidden ? 'Not quite. Want a lifeline?' : 'Not quite. Try again.';
        say('Try again');
      }
    });
    pod.querySelector('[data-lifeline]').addEventListener('click', () => { hint.hidden = false; say('Lifeline used'); });
    pod.querySelector('[data-reveal]').addEventListener('click', () => {
      [...answer].forEach((ch, k) => { sq[k].value = ch; sq[k].readOnly = true; });
      pod.classList.add('is-revealed');
      result.textContent = 'There it is. No points, no shame.';
      say('Answer shown');
    });
  });
})();
