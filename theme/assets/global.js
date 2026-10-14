/* Throwback theme: shared behaviour. Header, phone menu, cart drawer (Section Rendering API), receipt clock,
   footer tape counter, ticker speed. No dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('no-motion');
  const T = window.theme || { routes: { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', root: '/' }, cartType: 'drawer', strings: {} };

  /* ---------- focus trap for dialogs ---------- */
  function trap(container, onEscape) {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const keydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      const f = $$(sel, container).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', keydown);
    return () => container.removeEventListener('keydown', keydown);
  }

  /* ---------- header: stuck state ---------- */
  const hdrSection = $('.sct-header');
  if (hdrSection) {
    const onScroll = () => hdrSection.classList.toggle('is-stuck', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- phone menu: sticker sheet ---------- */
  const sheet = $('[data-menu-sheet]');
  const menuBtn = $('[data-menu-open]');
  let untrapMenu = null;
  function openMenu() {
    if (!sheet) return;
    sheet.hidden = false;
    document.documentElement.classList.add('no-scroll');
    menuBtn && menuBtn.setAttribute('aria-expanded', 'true');
    untrapMenu = trap(sheet, closeMenu);
    setTimeout(() => { const c = $('[data-menu-close]', sheet); c && c.focus(); }, 30);
  }
  function closeMenu() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    untrapMenu && untrapMenu();
    menuBtn && menuBtn.focus();
  }
  menuBtn && menuBtn.addEventListener('click', openMenu);
  sheet && sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-menu-close]')) closeMenu(); });

  /* ---------- cart drawer ---------- */
  const drawer = $('[data-cart-drawer]');
  let untrapCart = null, lastFocus = null;
  function stampReceipts(root = document) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    const txt = `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${String(d.getFullYear()).slice(2)}  ${h}:${pad(d.getMinutes())} ${ap}`;
    $$('[data-rcpt-date]', root).forEach(el => { el.textContent = txt; });
  }
  stampReceipts();
  function openCart() {
    if (!drawer) { window.location.href = T.routes.cart; return; }
    if (sheet && !sheet.hidden) closeMenu();
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add('no-scroll');
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    untrapCart = trap(drawer, closeCart);
    setTimeout(() => { const c = $('.drawer__close', drawer); c && c.focus(); }, 60);
  }
  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    untrapCart && untrapCart();
    const done = () => { drawer.hidden = true; };
    reduced() ? done() : setTimeout(done, 320);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && drawer && T.cartType === 'drawer' && !document.body.classList.contains('tpl-cart')) { e.preventDefault(); openCart(); return; }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); closeCart(); }
  });

  function setCount(n) {
    $$('[data-cart-count]').forEach(el => { el.textContent = n; });
    const cart = $('.hdr__cart');
    if (cart) {
      cart.setAttribute('aria-label', cart.getAttribute('aria-label').replace(/\d+ items?/, `${n} item${n === 1 ? '' : 's'}`));
      cart.classList.remove('is-bumped'); void cart.offsetWidth; cart.classList.add('is-bumped');
    }
  }
  function renderSections(sections) {
    if (!sections) return;
    if (sections['cart-drawer'] && drawer) {
      const doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      const body = $('[data-cart-body]', doc);
      if (body) { $('[data-cart-body]', drawer).innerHTML = body.innerHTML; stampReceipts(drawer); }
    }
    const main = $('[data-cart-page]');
    if (main && sections[main.dataset.section]) {
      const doc = new DOMParser().parseFromString(sections[main.dataset.section], 'text/html');
      const nb = $('[data-cart-page]', doc);
      if (nb) { main.innerHTML = nb.innerHTML; stampReceipts(main); }
    }
  }
  const sectionIds = () => ['cart-drawer'].concat($('[data-cart-page]') ? [$('[data-cart-page]').dataset.section] : []).filter(Boolean);

  async function addToCart(form, button) {
    const fd = new FormData(form);
    fd.append('sections', sectionIds().join(','));
    fd.append('sections_url', window.location.pathname);
    if (button) { button.classList.add('is-loading'); button.setAttribute('aria-disabled', 'true'); }
    try {
      const res = await fetch(`${T.routes.cartAdd}.js`, { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: fd });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || T.strings.cartError);
      renderSections(data.sections);
      const cart = await (await fetch(`${T.routes.cart}.js`, { headers: { Accept: 'application/json' } })).json();
      setCount(cart.item_count);
      document.dispatchEvent(new CustomEvent('cart:added', { detail: { item: data, cart } }));
      if (T.cartType === 'page') window.location.href = T.routes.cart; else openCart();
    } catch (err) {
      const msg = form.querySelector('[data-form-error]');
      if (msg) { msg.textContent = err.message; msg.hidden = false; } else alert(err.message);
    } finally {
      if (button) { button.classList.remove('is-loading'); button.removeAttribute('aria-disabled'); }
    }
  }
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const action = form.getAttribute('action') || '';
    if (!action.includes('/cart/add')) return;
    e.preventDefault();
    addToCart(form, e.submitter || form.querySelector('[type=submit]'));
  });

  async function changeLine(line, quantity, scope) {
    scope && scope.classList.add('is-busy');
    try {
      const res = await fetch(`${T.routes.cartChange}.js`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity, sections: sectionIds(), sections_url: window.location.pathname }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.description || T.strings.cartError);
      renderSections(data.sections);
      setCount(data.item_count);
    } catch (err) { alert(err.message); }
    finally { scope && scope.classList.remove('is-busy'); }
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-line-qty]');
    if (!btn) return;
    const li = btn.closest('[data-line]');
    if (!li) return;
    e.preventDefault();
    changeLine(+li.dataset.line, Math.max(0, +btn.dataset.lineQty), btn.closest('[data-receipt]'));
  });
  document.addEventListener('change', e => {
    const input = e.target.closest('[data-line-input]');
    if (!input) return;
    const li = input.closest('[data-line]');
    changeLine(+li.dataset.line, Math.max(0, parseInt(input.value || '0', 10)), input.closest('[data-receipt]'));
  });

  /* ---------- footer: the tape rewinds when it comes into view ---------- */
  const counter = $('[data-vcr-counter]');
  if (counter && 'IntersectionObserver' in window) {
    const t0 = performance.now();
    const fmt = s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
    let done = false;
    const io = new IntersectionObserver(entries => {
      if (done || !entries.some(en => en.isIntersecting)) return;
      done = true; io.disconnect();
      const start = Math.max(7, (performance.now() - t0) / 1000);
      if (reduced()) { counter.textContent = '0:00:00'; return; }
      const dur = 1400, t1 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t1) / dur);
        counter.textContent = fmt(start * (1 - (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick); else counter.textContent = '0:00:00';
      };
      requestAnimationFrame(tick);
    }, { threshold: .35 });
    io.observe(counter.closest('[data-vcr]') || counter);
  }

  /* ---------- ticker: constant crawl speed whatever the message length ---------- */
  $$('[data-ticker]').forEach(w => {
    const list = $('.tkr__list', w);
    if (!list) return;
    const set = () => w.closest('.tkr').style.setProperty('--tkr-speed', `${Math.max(18, list.scrollWidth / 62)}s`);
    set();
    window.addEventListener('resize', set, { passive: true });
  });

  window.themeCart = { open: openCart, close: closeCart, add: addToCart, setCount };
})();
