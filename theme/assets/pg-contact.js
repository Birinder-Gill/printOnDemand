/* Contact: date and time on the slip, the signature line copies the name, and the answering machine plays the
   greeting word by word. */
(() => {
  const root = document.querySelector('.ct');
  if (!root) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-motion');

  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  const date = root.querySelector('[data-ct-date]'), time = root.querySelector('[data-ct-time]');
  if (date) date.textContent = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
  if (time) time.textContent = `${h}:${pad(d.getMinutes())} ${ap}`;

  const name = root.querySelector('#ContactName'), sig = root.querySelector('[data-ct-sig]');
  if (name && sig) {
    const copy = () => { sig.textContent = name.value.trim() || ' '; };
    name.addEventListener('input', copy); copy();
  }
  const done = root.querySelector('#ContactSuccess') || root.querySelector('#ContactErrors');
  if (done) { done.scrollIntoView({ block: 'center' }); done.focus && done.focus(); }

  // answering machine
  const am = root.querySelector('[data-am]'), btn = root.querySelector('[data-am-play]'), led = root.querySelector('[data-am-led]');
  const text = root.querySelector('[data-am-text]');
  if (!am || !btn || !text) return;
  am.classList.add('is-blink');
  // wrap words once (text nodes only, so links and emphasis stay intact)
  const words = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3 && n.textContent.trim()) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span'); s.className = 'og__w'; s.textContent = part; words.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(text);
  let timer = null, i = 0;
  const stop = () => {
    clearInterval(timer); timer = null;
    am.classList.remove('is-playing');
    btn.setAttribute('aria-pressed', 'false');
    words.forEach(w => w.classList.remove('is-on', 'is-said'));
  };
  btn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    am.classList.remove('is-blink');
    if (led) led.textContent = '01';
    btn.setAttribute('aria-pressed', 'true');
    if (reduced) { words.forEach(w => w.classList.add('is-said')); setTimeout(stop, 2500); timer = 1; return; }
    am.classList.add('is-playing');
    i = 0;
    timer = setInterval(() => {
      if (i > 0) { words[i - 1].classList.remove('is-on'); words[i - 1].classList.add('is-said'); }
      if (i >= words.length) { setTimeout(stop, 900); clearInterval(timer); timer = -1; return; }
      words[i].classList.add('is-on');
      i++;
    }, 260);
  });
})();
