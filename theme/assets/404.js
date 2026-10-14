/* 404: CONTINUE? counts down from 9, then GAME OVER. */
(() => {
  const lcd = document.querySelector('[data-nf-lcd]'), n = document.querySelector('[data-nf-count]');
  if (!lcd || !n) return;
  let c = 9;
  const t = setInterval(() => {
    c -= 1;
    if (c < 0) { clearInterval(t); lcd.classList.add('is-over'); return; }
    n.textContent = c;
  }, 1000);
})();
