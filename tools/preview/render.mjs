// Local preview of the Shopify theme: renders templates with LiquidJS and mocks of the Shopify objects.
//   node render.mjs [template ...]      -> /home/claude/work/preview/<template>.html
// Templates are names like index, product, cart, page.about, collection, search, 404, password, gift_card, blog, article.
import { Liquid, Tag, Value, Hash, TokenKind } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { mocks } from './mocks.mjs';
import { imageObj, imageSize, hash } from './util.mjs';

const THEME = '/home/claude/store/theme';
const OUT = '/home/claude/work/preview';
import { MEDIA } from './util.mjs';
fs.mkdirSync(OUT, { recursive: true });

const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
const locale = readJSON(`${THEME}/locales/en.default.json`);
const settingsSchema = readJSON(`${THEME}/config/settings_schema.json`);
const settingsData = fs.existsSync(`${THEME}/config/settings_data.json`) ? readJSON(`${THEME}/config/settings_data.json`) : { current: {} };

const engine = new Liquid({
  root: [THEME],
  partials: [`${THEME}/snippets`],
  extname: '.liquid',
  cache: false,
  jsTruthy: false,
  strictFilters: true,
  strictVariables: false,
  ownPropertyOnly: false,
  greedy: false,
  globals: {},
});

// ---------- helpers --------------------------------------------------------------------------------------------
function money(cents, fmt = 'Rs. {{amount}}', trim = false) {
  const n = Number(cents || 0) / 100;
  let a = n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (trim && a.endsWith('.00')) a = a.slice(0, -3);
  return fmt.replace(/\{\{\s*amount[a-z_]*\s*\}\}/, a);
}
function tlookup(key) {
  let v = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), locale);
  return v;
}
function attrs(obj) { return Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => v === true ? k : `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' '); }

// ---------- filters --------------------------------------------------------------------------------------------
const F = (name, fn) => engine.registerFilter(name, fn);
F('asset_url', s => `/assets/${s}`);
F('asset_img_url', (s) => `/assets/${s}`);
F('file_url', s => `/media/files/${s}`);
F('file_img_url', s => `/media/files/${s}`);
F('shopify_asset_url', s => `/assets/${s}`);
F('global_asset_url', s => `/assets/${s}`);
F('inline_asset_content', s => { try { return fs.readFileSync(`${THEME}/assets/${s}`, 'utf8'); } catch (e) { return `<!-- missing ${s} -->`; } });
F('stylesheet_tag', (u, opts) => `<link href="${u}" rel="stylesheet" type="text/css" media="all" />`);
F('script_tag', u => `<script src="${u}" type="text/javascript"></script>`);
F('preload_tag', (u, ...a) => `<link href="${u}" rel="preload" as="style">`);
F('image_url', function (img, ...args) {
  if (!img) return '';
  const o = typeof img === 'object' ? img : imageObj(String(img));
  const h = new Map(); for (let i = 0; i < args.length; i++) { if (Array.isArray(args[i])) h.set(args[i][0], args[i][1]); }
  const w = h.get('width');
  return o.src + (w ? `?width=${w}` : '');
});
F('img_url', (img, size) => { if (!img) return ''; const o = typeof img === 'object' ? img : imageObj(String(img)); return o.src; });
F('image_tag', function (url, ...args) {
  const h = {}; for (const a of args) if (Array.isArray(a)) h[a[0]] = a[1];
  const src = String(url).split('?')[0];
  const file = src.startsWith('/media/') ? `${MEDIA}/${src.slice(7)}` : null;
  const d = file ? imageSize(file) : { w: h.width || 1000, h: h.height || 1000 };
  const widths = (h.widths || '').toString().split(',').map(s => s.trim()).filter(Boolean);
  const srcset = widths.length ? widths.map(w => `${src}?width=${w} ${w}w`).join(', ') : undefined;
  const a = { src: url, alt: h.alt ?? '', width: h.width || d.w, height: h.height || (h.width ? Math.round(h.width * d.h / d.w) : d.h), loading: h.loading, fetchpriority: h.fetchpriority, class: h.class, sizes: h.sizes, srcset, style: h.style, id: h.id, decoding: h.decoding };
  for (const k of Object.keys(h)) if (k.startsWith('data-')) a[k] = h[k];
  return `<img ${attrs(a)}>`;
});
F('money', c => money(c, mocks.shop.money_format));
F('money_with_currency', c => money(c, mocks.shop.money_with_currency_format));
F('money_without_trailing_zeros', c => money(c, mocks.shop.money_format, true));
F('money_without_currency', c => money(c, '{{amount}}'));
F('t', function (key, ...args) {
  const h = {}; for (const a of args) if (Array.isArray(a)) h[a[0]] = a[1];
  let v = tlookup(key);
  if (v === undefined) return `[missing: ${key}]`;
  if (typeof v === 'object') v = (h.count === 1 ? v.one : v.other) ?? JSON.stringify(v);
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => h[k] ?? '');
});
F('json', v => JSON.stringify(v));
F('handle', s => String(s ?? '').toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
F('handleize', s => String(s ?? '').toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
F('pluralize', (n, one, many) => (Number(n) === 1 ? one : many));
F('link_to', (t, u, title) => `<a href="${u}"${title ? ` title="${title}"` : ''}>${t}</a>`);
F('within', u => u);
F('default_pagination', () => '');
F('placeholder_svg_tag', (n, c) => `<svg class="${c || ''}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ccc"/></svg>`);
F('payment_type_svg_tag', () => '');
F('payment_button', () => '<div class="shopify-payment-button"><button type="button" class="shopify-payment-button__button" style="width:100%;height:48px;background:#5a31f4;color:#fff;border:0;border-radius:8px;font:700 16px sans-serif">Buy with ShopPay</button></div>');
F('structured_data', () => '{}');
F('url_encode', s => encodeURIComponent(s));
F('url_escape', s => encodeURI(s));
F('md5', s => String(Math.abs(hash(String(s)))));
F('base64_encode', s => Buffer.from(String(s)).toString('base64'));
F('base64_decode', s => Buffer.from(String(s), 'base64').toString());
F('color_to_rgb', s => s); F('color_modify', s => s); F('color_lighten', s => s); F('color_darken', s => s);
F('font_face', () => ''); F('font_url', () => ''); F('font_modify', f => f);
F('time_tag', (d, f) => `<time>${d}</time>`);
F('format_address', () => '');
F('highlight', (s) => s);
F('weight_with_unit', (g) => `${(Number(g) / 1000).toFixed(2)} kg`);
F('sort_natural', a => [...a].sort());
F('customer_login_link', t => `<a href="/account/login">${t}</a>`);
F('avatar', () => '');
F('metafield_tag', v => String(v));
F('metafield_text', v => String(v));
F('product_img_url', (i) => (typeof i === 'object' ? i.src : i));

// ---------- tags -----------------------------------------------------------------------------------------------
function rawBlock(name) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.tpls = [];
      let closed = false;
      while (remain.length) {
        const t = remain.shift();
        if (t.name === 'end' + name) { closed = true; break; }
        this.tpls.push(t);
      }
      if (!closed) throw new Error(`tag ${name} not closed`);
    }
    *render() { return ''; }
  });
}
rawBlock('schema');
rawBlock('comment_preview');

// {% style %} renders its body inside <style data-shopify>
engine.registerTag('style', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endstyle', () => stream.stop()).on('template', t => this.tpls.push(t)).on('end', () => { throw new Error('style not closed'); });
    stream.start();
  }
  *render(ctx, emitter) { emitter.write('<style data-shopify>'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); emitter.write('</style>'); }
});
for (const n of ['stylesheet', 'javascript']) rawBlock(n);

// {% form 'type', obj, key: val %}
engine.registerTag('form', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    const args = token.args;
    const m = args.match(/^\s*['"]([\w-]+)['"]\s*(?:,\s*([^:,]+?)\s*(?=,|$))?(.*)$/s);
    this.type = m ? m[1] : 'unknown';
    this.obj = m && m[2] && !m[2].includes(':') ? m[2] : null;
    const rest = m ? (m[2] && m[2].includes(':') ? m[2] + m[3] : m[3]) : '';
    this.hash = new Hash(rest.replace(/^\s*,/, ''));
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endform', () => stream.stop()).on('template', t => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    const h = yield this.hash.render(ctx);
    const actions = { product: '/cart/add', customer: '/contact#newsletter', contact: '/contact#contact_form', storefront_password: '/password', cart: '/cart', localization: '/localization', create_customer: '/account', customer_login: '/account/login' };
    const a = { method: 'post', action: actions[this.type] || '/', id: h.id, class: h.class, 'accept-charset': 'UTF-8', 'data-type': this.type, novalidate: h.novalidate ? 'novalidate' : undefined };
    for (const k of Object.keys(h)) if (k.startsWith('data-') || k.startsWith('aria-')) a[k] = h[k];
    emitter.write(`<form ${attrs(a)}><input type="hidden" name="form_type" value="${this.type}"><input type="hidden" name="utf8" value="✓">`);
    ctx.push({ form: { id: h.id || this.type, posted_successfully: false, 'posted_successfully?': false, errors: null, email: '', body: '', password_needed: true } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
    emitter.write('</form>');
  }
});

// {% paginate x by n %}
engine.registerTag('paginate', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endpaginate', () => stream.stop()).on('template', t => this.tpls.push(t)).on('end', () => { throw new Error('paginate not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    ctx.push({ paginate: { current_page: 1, pages: 1, items: 1, page_size: 12, parts: [], previous: null, next: null } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  }
});

// {% section 'name' %} (static) and {% sections 'group' %}
let sectionCounter = 0;
async function renderSection(type, id, data, scope) {
  const file = `${THEME}/sections/${type}.liquid`;
  const src = fs.readFileSync(file, 'utf8');
  const schemaM = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  const schema = schemaM ? JSON.parse(schemaM[1]) : {};
  const settings = {};
  for (const s of schema.settings || []) if (s.id) settings[s.id] = s.default;
  Object.assign(settings, data.settings || {});
  for (const s of schema.settings || []) resolveSetting(s, settings);
  const blocks = [];
  const order = data.block_order || Object.keys(data.blocks || {});
  for (const bid of order) {
    const b = data.blocks[bid];
    if (!b || b.disabled) continue;
    const bs = (schema.blocks || []).find(x => x.type === b.type) || {};
    const bset = {};
    for (const s of bs.settings || []) if (s.id) bset[s.id] = s.default;
    Object.assign(bset, b.settings || {});
    for (const s of bs.settings || []) resolveSetting(s, bset);
    blocks.push({ id: bid, type: b.type, settings: bset, shopify_attributes: `data-block="${bid}"` });
  }
  const section = { id, settings, blocks, index: ++sectionCounter, location: data.location || 'template' };
  const html = await engine.parseAndRender(src, { ...scope, section }, { globals: globalsOf(scope) });
  const cls = schema.class ? ` ${schema.class}` : '';
  const tag = schema.tag || 'div';
  return `<${tag} id="shopify-section-${id}" class="shopify-section${cls}">${html}</${tag}>`;
}
function resolveSetting(s, obj) {
  const v = obj[s.id];
  if (s.type === 'image_picker') obj[s.id] = v ? imageObj(v, '') : null;
  else if (s.type === 'product') obj[s.id] = v ? (mocks.all_products[v] || null) : null;
  else if (s.type === 'collection') obj[s.id] = v ? mocks.collections[v] || null : null;
  else if (s.type === 'link_list') obj[s.id] = v ? mocks.linklists[v] || null : null;
  else if (s.type === 'page') obj[s.id] = v ? mocks.pages[v] || null : null;
  else if (s.type === 'url') obj[s.id] = v === undefined || v === null || v === '' ? null : String(v).replace(/^shopify:\/\/(products|pages|collections|blogs)\//, '/$1/').replace(/^shopify:\/\/policies\//, '/policies/');
}

engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); }
  *render(ctx, emitter) {
    const data = (settingsData.current.sections || {})[this.name] || {};
    const html = yield renderSection(this.name, this.name, data, ctx.getAll());
    emitter.write(html);
  }
});
engine.registerTag('sections', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); }
  *render(ctx, emitter) {
    const g = readJSON(`${THEME}/sections/${this.name}.json`);
    for (const id of g.order) {
      const s = g.sections[id];
      if (s.disabled) continue;
      emitter.write(yield renderSection(s.type, `sections--${this.name}__${id}`, s, ctx.getAll()));
    }
  }
});
engine.registerTag('content_for', class extends Tag { *render() { return ''; } });

const GLOBAL_KEYS = ['shop', 'routes', 'cart', 'settings', 'request', 'localization', 'linklists', 'all_products', 'collections', 'pages', 'template', 'customer', 'page_title', 'canonical_url', 'product', 'collection', 'page', 'blog', 'article', 'search', 'powered_by_link'];
function globalsOf(scope) { const g = {}; for (const k of GLOBAL_KEYS) if (scope[k] !== undefined) g[k] = scope[k]; return g; }
// ---------- page rendering -------------------------------------------------------------------------------------
function themeSettings() {
  const s = {};
  for (const grp of settingsSchema) for (const x of grp.settings || []) if (x.id) s[x.id] = x.default;
  Object.assign(s, settingsData.current || {});
  delete s.sections;
  for (const grp of settingsSchema) for (const x of grp.settings || []) if (x.id) resolveSetting(x, s);
  return s;
}

export async function renderTemplate(name) {
  sectionCounter = 0;
  const [base, suffix] = name.split('.');
  const scope = mocks.scopeFor(base, suffix);
  scope.settings = themeSettings();
  scope.template = { name: base, suffix: suffix || null, directory: null, toString() { return name; } };
  let tname = name;
  if (!fs.existsSync(`${THEME}/templates/${name}.json`) && !fs.existsSync(`${THEME}/templates/${name}.liquid`)) tname = base; // e.g. cart.empty -> cart.json with an empty cart
  const jsonFile = `${THEME}/templates/${tname}.json`;
  const liqFile = `${THEME}/templates/${tname}.liquid`;
  let content = '', layout = 'theme';
  if (fs.existsSync(jsonFile)) {
    const t = readJSON(jsonFile);
    if (t.layout === false) layout = null; else if (t.layout) layout = t.layout;
    for (const id of t.order) {
      const s = t.sections[id];
      if (s.disabled) continue;
      content += await renderSection(s.type, `template--${name}__${id}`, s, scope);
    }
  } else if (fs.existsSync(liqFile)) {
    let src = fs.readFileSync(liqFile, 'utf8');
    const lm = src.match(/\{%-?\s*layout\s+(none|['"][\w-]+['"])\s*-?%\}/);
    if (lm) { layout = lm[1] === 'none' ? null : lm[1].slice(1, -1); src = src.replace(lm[0], ''); }
    content = await engine.parseAndRender(src, scope, { globals: globalsOf(scope) });
  } else throw new Error('no template ' + name);
  if (!layout) return content;
  const lsrc = fs.readFileSync(`${THEME}/layout/${layout}.liquid`, 'utf8');
  return engine.parseAndRender(lsrc, { ...scope, content_for_layout: content, content_for_header: mocks.content_for_header }, { globals: globalsOf(scope) });
}

if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const names = process.argv.slice(2);
  const all = names.length ? names : fs.readdirSync(`${THEME}/templates`).filter(f => /\.(json|liquid)$/.test(f) && !f.startsWith('customers')).map(f => f.replace(/\.(json|liquid)$/, ''));
  for (const n of all) {
    try {
      const html = await renderTemplate(n);
      fs.writeFileSync(`${OUT}/${n}.html`, html);
      const missing = [...html.matchAll(/\[missing: ([^\]]+)\]/g)].map(m => m[1]);
      console.log('ok', n, (html.length / 1024).toFixed(0) + 'KB', missing.length ? 'MISSING ' + [...new Set(missing)].join(', ') : '');
    } catch (e) {
      console.log('ERR', n, e.message.split('\n').slice(0, 6).join(' | '));
    }
  }
}
