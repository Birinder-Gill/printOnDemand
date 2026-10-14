/* Quiet Hour Press: shared behaviour. Sticky header, phone menu, cart drawer (Section Rendering API),
   product forms (variant pills, quantity steppers), scroll reveals. No dependencies. */
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

  /* ---------- phone menu ---------- */
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
  sheet && sheet.addEventListener('click', e => { if (e.target.closest('[data-menu-close]')) closeMenu(); });
  window.matchMedia('(min-width: 990px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  /* ---------- cart drawer ---------- */
  const drawer = $('[data-cart-drawer]');
  let untrapCart = null, lastFocus = null;
  function openCart() {
    if (!drawer) { window.location.href = T.routes.cart; return; }
    if (sheet && !sheet.hidden) closeMenu();
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add('no-scroll');
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
    untrapCart = trap(drawer, closeCart);
    setTimeout(() => { const c = $('[data-cart-focus]', drawer); c && c.focus(); }, 60);
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
    $$('[data-cart-bump]').forEach(el => {
      const label = el.getAttribute('aria-label');
      if (label) el.setAttribute('aria-label', label.replace(/\d+ items?/, `${n} item${n === 1 ? '' : 's'}`));
      el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped');
    });
  }
  function renderSections(sections) {
    if (!sections) return;
    if (sections['cart-drawer'] && drawer) {
      const doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      const body = $('[data-cart-body]', doc);
      if (body) $('[data-cart-body]', drawer).innerHTML = body.innerHTML;
    }
    const main = $('[data-cart-page]');
    if (main && sections[main.dataset.section]) {
      const doc = new DOMParser().parseFromString(sections[main.dataset.section], 'text/html');
      const nb = $('[data-cart-page]', doc);
      if (nb) main.innerHTML = nb.innerHTML;
    }
  }
  const sectionIds = () => ['cart-drawer'].concat($('[data-cart-page]') ? [$('[data-cart-page]').dataset.section] : []).filter(Boolean);

  async function addToCart(form, button) {
    const fd = new FormData(form);
    fd.append('sections', sectionIds().join(','));
    fd.append('sections_url', window.location.pathname);
    const err = form.querySelector('[data-form-error]');
    if (err) err.hidden = true;
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
    } catch (error) {
      if (err) { err.textContent = error.message; err.hidden = false; } else alert(error.message);
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
    } catch (error) { alert(error.message); }
    finally { scope && scope.classList.remove('is-busy'); }
  }
  const scopeOf = el => el.closest('[data-cart-scope]') || el.closest('[data-receipt]');
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-line-qty]');
    if (!btn) return;
    const li = btn.closest('[data-line]');
    if (!li) return;
    e.preventDefault();
    changeLine(+li.dataset.line, Math.max(0, +btn.dataset.lineQty), scopeOf(btn));
  });
  document.addEventListener('change', e => {
    const input = e.target.closest('[data-line-input]');
    if (!input) return;
    const li = input.closest('[data-line]');
    changeLine(+li.dataset.line, Math.max(0, parseInt(input.value || '0', 10)), scopeOf(input));
  });

  /* ---------- product forms: quantity steppers and variant pills ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-qty-step]');
    if (!b) return;
    const input = b.parentElement.querySelector('input');
    input.value = Math.max(1, (parseInt(input.value, 10) || 1) + +b.dataset.qtyStep);
  });
  document.addEventListener('change', e => {
    const r = e.target.closest('[data-variant-pill]');
    if (!r) return;
    const form = r.form;
    const root = r.closest('[data-buybox]') || form;
    const price = r.dataset.price, was = r.dataset.compare;
    $$('[data-variant-price]', root).forEach(el => { el.textContent = price; });
    $$('[data-variant-compare]', root).forEach(el => { el.textContent = was || ''; el.hidden = !was; });
    const btn = form.querySelector('[name=add]');
    if (btn) {
      const ok = r.dataset.available === 'true';
      btn.disabled = !ok;
      const label = btn.querySelector('[data-add-label]');
      if (label) label.textContent = ok ? T.strings.addToCart : T.strings.soldOut;
    }
    if (window.history.replaceState) { const u = new URL(window.location.href); u.searchParams.set('variant', r.value); window.history.replaceState({}, '', u); }
    document.dispatchEvent(new CustomEvent('variant:change', { detail: { id: r.value, media: r.dataset.media } }));
  });

  /* ---------- reveal on scroll ---------- */
  const rises = $$('.q-rise');
  if (rises.length) {
    if (reduced() || !('IntersectionObserver' in window)) rises.forEach(el => el.classList.add('is-in'));
    else {
      const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      rises.forEach(el => io.observe(el));
    }
  }

  window.themeCart = { open: openCart, close: closeCart, add: addToCart, setCount };
})();
