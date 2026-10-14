/* Cart page: keep the receipt from re-printing after re-renders, and save the order note as it's written. */
(() => {
  const ck = document.querySelector('.ck[data-cart-page]');
  if (!ck) return;
  const rcpt = ck.querySelector('.ck__receipt');
  const done = () => ck.classList.add('is-printed');
  if (rcpt) { rcpt.addEventListener('animationend', done, { once: true }); setTimeout(done, 2500); } else done();

  const route = ((window.theme && window.theme.routes && window.theme.routes.cart) || '/cart') + '/update.js';
  let timer = null;
  const save = async el => {
    const status = ck.querySelector('[data-cart-note-status]');
    try {
      const res = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ note: el.value }) });
      if (!res.ok) throw new Error();
      if (status) { status.textContent = 'Saved'; setTimeout(() => { status.textContent = ''; }, 1800); }
    } catch (e) { if (status) status.textContent = (window.theme && window.theme.strings && window.theme.strings.cartError) || 'Not saved'; }
  };
  // delegated, because the whole counter is re-rendered after quantity changes
  ck.addEventListener('input', e => {
    const el = e.target.closest('[data-cart-note]');
    if (!el) return;
    clearTimeout(timer);
    timer = setTimeout(() => save(el), 600);
  });
})();
