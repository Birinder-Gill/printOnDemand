/* Quiet Hour Press: shared behaviour. Sticky header, phone menu, cart drawer (Section Rendering API),
   product forms (variant pills, quantity steppers), marquee pause, scroll reveals. No dependencies.
   Everything is looked up when it is used, so it keeps working after the theme editor re-renders a section. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('no-motion');
  const designMode = () => !!(window.Shopify && window.Shopify.designMode);
  const T = window.theme || { routes: { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', root: '/' }, cartType: 'drawer', strings: {} };
  const S = T.strings || {};

  /* ---------- focus trap for dialogs: listens on the document so it survives re-rendered content ---------- */
  function trap(container, onEscape) {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const keydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      const f = $$(sel, container).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!container.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }

  /* ---------- header: stuck state ---------- */
  const onScroll = () => { const h = $('.sct-header'); if (h) h.classList.toggle('is-stuck', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- phone menu ---------- */
  let untrapMenu = null;
  function openMenu() {
    const sheet = $('[data-menu-sheet]');
    if (!sheet || !sheet.hidden) return;
    sheet.hidden = false;
    root.classList.add('no-scroll');
    $$('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', 'true'));
    untrapMenu = trap(sheet, closeMenu);
    setTimeout(() => { const c = $('[data-menu-close]', sheet); c && c.focus(); }, 30);
  }
  function closeMenu() {
    const sheet = $('[data-menu-sheet]');
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    root.classList.remove('no-scroll');
    $$('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (untrapMenu) { untrapMenu(); untrapMenu = null; }
    const btn = $('[data-menu-open]');
    btn && btn.focus();
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-menu-open]')) { openMenu(); return; }
    if (e.target.closest('[data-menu-sheet] [data-menu-close]')) closeMenu();
  });
  const mq = window.matchMedia('(min-width: 1100px)');
  const onMq = e => { if (e.matches) closeMenu(); };
  mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq);

  /* ---------- cart drawer ---------- */
  const drawerEl = () => $('[data-cart-drawer]');
  let untrapCart = null, lastFocus = null, hideTimer = 0;
  function openCart() {
    const drawer = drawerEl();
    if (!drawer) { window.location.href = T.routes.cart; return; }
    // a native modal (e.g. the rental card on the video-store page) sits in the top layer: close it first
    const dlg = $('dialog[open]');
    if (dlg) { dlg.addEventListener('close', () => openCart(), { once: true }); dlg.close(); return; }
    clearTimeout(hideTimer);
    closeMenu();
    if (untrapCart) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    root.classList.add('no-scroll');
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
    untrapCart = trap(drawer, closeCart);
    setTimeout(() => { const c = $('[data-cart-focus]', drawer); c && c.focus(); }, 60);
  }
  function closeCart() {
    const drawer = drawerEl();
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    root.classList.remove('no-scroll');
    if (untrapCart) { untrapCart(); untrapCart = null; }
    const done = () => { drawer.hidden = true; };
    if (reduced()) done(); else hideTimer = setTimeout(done, 320);
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener && drawerEl() && T.cartType === 'drawer' && !document.body.classList.contains('tpl-cart')) { e.preventDefault(); openCart(); return; }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); closeCart(); }
  });

  function announce(msg) { const s = $('[data-cart-status]'); if (s && msg) { s.textContent = ''; setTimeout(() => { s.textContent = msg; }, 60); } }
  function setCount(n) {
    $$('[data-cart-count]').forEach(el => { el.textContent = n; });
    $$('[data-cart-bump]').forEach(el => {
      const label = el.getAttribute('aria-label');
      if (label) el.setAttribute('aria-label', label.replace(/\d+ items?/, `${n} item${n === 1 ? '' : 's'}`));
      el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped');
    });
  }
  // Remember which cart control had focus (by line and by position, since the +/- values change) so it can be
  // focused again after the markup is replaced.
  function focusKey() {
    const a = document.activeElement;
    if (!a || !a.closest) return null;
    const li = a.closest('[data-line]');
    if (!li) return null;
    const ctrls = $$('[data-line-qty],[data-line-input]', li);
    return { scope: a.closest('[data-cart-drawer]') ? 'drawer' : 'page', line: li.dataset.line, idx: ctrls.indexOf(a) };
  }
  function restoreFocus(key) {
    if (!key) return;
    const scope = key.scope === 'drawer' ? drawerEl() : $('[data-cart-page]');
    if (!scope) return;
    const li = $(`[data-line="${key.line}"]`, scope) || $$('[data-line]', scope).pop();
    const t = li ? $$('[data-line-qty],[data-line-input]', li)[Math.max(0, key.idx)] : null;
    (t || $('[data-cart-focus]', scope) || $('a,button', scope))?.focus();
  }
  function renderSections(sections) {
    if (!sections) return;
    const key = focusKey();
    const drawer = drawerEl();
    if (sections['cart-drawer'] && drawer) {
      const doc = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
      const body = $('[data-cart-body]', doc);
      if (body) $('[data-cart-body]', drawer).innerHTML = body.innerHTML;
    }
    const main = $('[data-cart-page]');
    if (main && sections[main.dataset.section]) {
      const doc = new DOMParser().parseFromString(sections[main.dataset.section], 'text/html');
      const nb = $('[data-cart-page]', doc);
      const oldNote = $('[name=note]', main);
      const note = oldNote ? oldNote.value : null;
      if (nb) main.innerHTML = nb.innerHTML;
      const newNote = $('[name=note]', main);
      if (newNote && note !== null) newNote.value = note;
      const ol = $('[data-cart-count-label]'), nl = $('[data-cart-count-label]', doc);
      if (ol && nl) ol.textContent = nl.textContent;
    }
    restoreFocus(key);
  }
  const sectionIds = () => ['cart-drawer'].concat($('[data-cart-page]') ? [$('[data-cart-page]').dataset.section] : []).filter(Boolean);

  async function addToCart(form, button) {
    if (form.dataset.busy) return;
    form.dataset.busy = '1';
    const fd = new FormData(form);
    fd.append('sections', sectionIds().join(','));
    fd.append('sections_url', window.location.pathname);
    const err = form.querySelector('[data-form-error]');
    if (err) err.hidden = true;
    if (button) { button.classList.add('is-loading'); button.setAttribute('aria-disabled', 'true'); }
    try {
      const res = await fetch(`${T.routes.cartAdd}.js`, { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: fd });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || S.cartError);
      renderSections(data.sections);
      const cart = await (await fetch(`${T.routes.cart}.js`, { headers: { Accept: 'application/json' } })).json();
      setCount(cart.item_count);
      announce(S.added);
      document.dispatchEvent(new CustomEvent('cart:added', { detail: { item: data, cart } }));
      if (T.cartType === 'page') window.location.href = T.routes.cart; else openCart();
    } catch (error) {
      if (err) { err.textContent = error.message; err.hidden = false; } else alert(error.message);
    } finally {
      delete form.dataset.busy;
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
      if (!res.ok) throw new Error(data.description || S.cartError);
      renderSections(data.sections);
      setCount(data.item_count);
      announce(S.cartUpdated);
    } catch (error) { alert(error.message); }
    finally { scope && document.contains(scope) && scope.classList.remove('is-busy'); }
  }
  const scopeOf = el => el.closest('[data-cart-scope]');
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
  // Enter in a quantity box commits the number instead of submitting the cart form (which would check out)
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-line-input]')) { e.preventDefault(); e.target.blur(); }
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
    const box = r.closest('[data-buybox]') || form;
    const price = r.dataset.price, was = r.dataset.compare;
    const ok = r.dataset.available === 'true';
    $$('[data-variant-price]', box).forEach(el => { el.textContent = price; });
    $$('[data-variant-compare]', box).forEach(el => { el.textContent = was || ''; el.hidden = !was; });
    $$('[data-variant-compare-label]', box).forEach(el => { el.hidden = !was; });
    $$('[data-price-label]', box).forEach(el => { el.textContent = was ? S.salePrice : S.price; });
    [...form.elements].filter(el => el.type === 'submit' && el.name !== 'checkout').forEach(b => { b.disabled = !ok; });
    $$('[data-add-label]', box).forEach(l => { l.textContent = ok ? S.addToCart : S.soldOut; });
    const tag = $('[data-avail]', box);
    if (tag) { tag.textContent = ok ? S.available : S.soldOut; tag.classList.toggle('is-out', !ok); }
    if (window.history.replaceState) { const u = new URL(window.location.href); u.searchParams.set('variant', r.value); window.history.replaceState({}, '', u); }
    document.dispatchEvent(new CustomEvent('variant:change', { detail: { id: r.value, media: r.dataset.media } }));
  });

  /* ---------- marquees: pause button (WCAG 2.2.2) ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-marquee-toggle]');
    if (!b) return;
    const m = b.closest('[data-marquee]');
    if (!m) return;
    const paused = m.classList.toggle('is-paused');
    b.setAttribute('aria-pressed', paused ? 'true' : 'false');
    const label = b.querySelector('[data-marquee-label]');
    if (label) label.textContent = paused ? (S.play || 'Play') : (S.pause || 'Pause');
  });

  /* ---------- reveal on scroll: hidden state only applies once this has run ---------- */
  let io = null;
  if (!reduced() && !designMode() && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  }
  const initRise = (scope = document) => $$('.q-rise:not(.is-in)', scope).forEach(el => (io ? io.observe(el) : el.classList.add('is-in')));
  initRise();
  if (io) root.classList.add('rise-ready');
  document.addEventListener('shopify:section:load', e => { $$('.q-rise', e.target).forEach(el => el.classList.add('is-in')); onScroll(); });

  window.themeCart = { open: openCart, close: closeCart, add: addToCart, setCount };
})();
