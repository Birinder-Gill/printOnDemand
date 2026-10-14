// Mock Shopify objects for the local preview. Shapes follow the Liquid reference closely enough for our theme.
import fs from 'node:fs';
import { imageObj, MEDIA } from './util.mjs';

const HANDLE = '90s-america-crossword-gift-edition';
const PRICE = 399900;

function media(file, alt, pos) {
  const img = imageObj('/media/' + file, alt);
  return { id: 3000 + pos, position: pos, media_type: 'image', alt, preview_image: img, aspect_ratio: img.aspect_ratio, width: img.width, height: img.height, src: img.src, ...img };
}
const productMediaFiles = fs.existsSync(`${MEDIA}/product`) ? fs.readdirSync(`${MEDIA}/product`).filter(f => /\.(jpe?g|png|webp)$/.test(f)).sort() : [];
const productMedia = productMediaFiles.map((f, i) => media('product/' + f, f.replace(/^\d+-|\.\w+$/g, '').replace(/-/g, ' '), i + 1));

const variant = { id: 4400001, title: 'Default Title', price: PRICE, compare_at_price: null, available: true, sku: 'NAC-GIFT-HC', inventory_management: null,
  options: ['Default Title'], option1: 'Default Title', requires_shipping: true, weight: 520, url: `/products/${HANDLE}?variant=4400001`, featured_media: productMedia[0] || null };

const product = {
  id: 7700001, title: '90s America Crossword — Gift Edition Hardcover', handle: HANDLE, url: `/products/${HANDLE}`,
  vendor: '90s America Crossword', type: 'Hardcover book', price: PRICE, price_min: PRICE, price_max: PRICE, price_varies: false,
  compare_at_price: null, compare_at_price_max: null, available: true, tags: ['crossword', '90s', 'gift', 'hardcover'],
  description: '<p>Forty-eight crosswords about the 1990s: the sitcoms, the blockbusters, the boy bands, the consoles, the snacks and the slang.</p>',
  content: '', featured_media: productMedia[0] || null, featured_image: productMedia[0] || null, media: productMedia, images: productMedia,
  variants: [variant], selected_variant: null, selected_or_first_available_variant: variant, first_available_variant: variant,
  has_only_default_variant: true, options: ['Title'], options_with_values: [{ name: 'Title', position: 1, values: ['Default Title'], selected_value: 'Default Title' }],
  requires_selling_plan: false, selling_plan_groups: [], metafields: {}, quantity_price_breaks_configured: false,
  'quantity_price_breaks_configured?': false, gift_card: false, 'gift_card?': false,
};

const cartItem = { id: variant.id, key: '4400001:abc', variant_id: variant.id, product_id: product.id, title: product.title, product_title: product.title,
  variant_title: null, quantity: 1, price: PRICE, original_price: PRICE, final_price: PRICE, line_price: PRICE, final_line_price: PRICE, original_line_price: PRICE,
  url: product.url, image: productMedia[0] || null, product, variant, options_with_values: [], properties: {}, discounts: [], line_level_discount_allocations: [], unit_price_measurement: null };
const cart = { item_count: 1, items: [cartItem], total_price: PRICE, items_subtotal_price: PRICE, original_total_price: PRICE, total_discount: 0,
  note: '', attributes: {}, currency: { iso_code: 'INR' }, requires_shipping: true, cart_level_discount_applications: [], empty: false };
const emptyCart = { item_count: 0, items: [], total_price: 0, items_subtotal_price: 0, original_total_price: 0, total_discount: 0, note: '', attributes: {}, currency: { iso_code: 'INR' } };

const link = (title, url, extra = {}) => ({ title, url, active: false, current: false, child_active: false, links: [], levels: 0, type: 'http_link', handle: title.toLowerCase().replace(/\W+/g, '-'), ...extra });
const linklists = {
  'main-menu': { handle: 'main-menu', title: 'Main menu', levels: 1, links: [
    link('The book', `/products/${HANDLE}`), link('Look inside', '/pages/inside-the-book'), link('Liner notes', '/pages/about'), link('FAQ', '/pages/faq'), link('Contact', '/pages/contact')] },
  footer: { handle: 'footer', title: 'Footer menu', levels: 1, links: [
    link('Shipping & returns', '/pages/shipping-returns'), link('FAQ', '/pages/faq'), link('Contact', '/pages/contact'), link('Search', '/search')] },
};

const page = (title, handle, content) => ({ id: 900 + handle.length, title, handle, url: `/pages/${handle}`, content, author: '', published_at: '2026-10-13', template_suffix: null });
const lorem = '<p>Forty-eight crosswords about the 1990s.</p><h2>A heading</h2><p>Another paragraph with <a href="#">a link</a>.</p><ul><li>One</li><li>Two</li></ul>';
const pages = {
  about: page('Liner notes', 'about', lorem), faq: page('FAQ', 'faq', lorem), contact: page('Contact', 'contact', '<p>Questions about an order or the book? Leave a message.</p>'),
  'shipping-returns': page('Shipping & returns', 'shipping-returns', lorem), 'inside-the-book': page('Inside the book', 'inside-the-book', lorem),
};

const collection = { id: 55, title: 'The Gift Shop', handle: 'all', url: '/collections/all', description: '<p>Everything in the shop.</p>', products: [product], products_count: 1, all_products_count: 1,
  image: null, featured_image: productMedia[0] || null, sort_by: 'manual', default_sort_by: 'manual', sort_options: [], filters: [], current_type: null, current_vendor: null };

const puzzles = JSON.parse(fs.readFileSync('/home/claude/store/tools/puzzles.json', 'utf8'));
const puzzleObjs = {};
for (const p of puzzles) {
  const o = {};
  for (const [k, v] of Object.entries(p)) o[k] = { value: v, toString() { return String(v); } };
  o.image = { value: imageObj('shopify://shop_images/' + p.image, '') };
  o.system = { handle: p.handle };
  puzzleObjs[p.handle] = o;
}
const shop = { metaobjects: { puzzle: puzzleObjs }, name: 'My Store 10', url: 'https://i7d9cn-v1.myshopify.com', secure_url: 'https://i7d9cn-v1.myshopify.com', domain: 'i7d9cn-v1.myshopify.com', email: 'shop@example.com',
  currency: 'INR', money_format: 'Rs. {{amount}}', money_with_currency_format: 'Rs. {{amount}} INR', description: '', permanent_domain: 'i7d9cn-v1.myshopify.com',
  refund_policy: { title: 'Refund policy', url: '/policies/refund-policy' }, privacy_policy: { title: 'Privacy policy', url: '/policies/privacy-policy' },
  terms_of_service: { title: 'Terms of service', url: '/policies/terms-of-service' }, shipping_policy: { title: 'Shipping policy', url: '/policies/shipping-policy' },
  contact_policy: null, policies: [], brand: { logo: null }, published_locales: [{ iso_code: 'en', primary: true }], customer_accounts_enabled: true, 'customer_accounts_enabled?': true };

const routes = { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', cart_clear_url: '/cart/clear',
  search_url: '/search', predictive_search_url: '/search/suggest', account_url: '/account', account_login_url: '/account/login', account_logout_url: '/account/logout',
  account_register_url: '/account/register', account_addresses_url: '/account/addresses', collections_url: '/collections', all_products_collection_url: '/collections/all', product_recommendations_url: '/recommendations/products' };

export const mocks = {
  shop, routes, linklists, pages, all_products: { [HANDLE]: product }, collections: { all: collection, [HANDLE]: collection },
  content_for_header: '<!-- content_for_header -->',
  scopeFor(base, suffix) {
    const s = {
      shop, routes, linklists, all_products: { [HANDLE]: product }, collections: { all: collection },
      cart: base === 'cart' && suffix === 'empty' ? emptyCart : cart,
      request: { locale: { iso_code: 'en', primary: true }, path: '/', host: 'i7d9cn-v1.myshopify.com', page_type: base, design_mode: false, visual_preview_mode: false },
      localization: { available_countries: [], available_languages: [], country: { iso_code: 'US', currency: { iso_code: 'INR', symbol: 'Rs.' } }, language: { iso_code: 'en' } },
      canonical_url: 'https://i7d9cn-v1.myshopify.com/', page_title: shop.name, page_description: 'Forty-eight crosswords about the 1990s.',
      customer: null, current_page: 1, current_tags: null, powered_by_link: '<a href="https://www.shopify.com" target="_blank" rel="nofollow">Powered by Shopify</a>',
      handle: '', additional_checkout_buttons: false, content_for_additional_checkout_buttons: '',
    };
    if (base === 'product') { s.product = product; s.page_title = product.title; s.request.path = product.url; }
    if (base === 'collection') { s.collection = collection; s.page_title = collection.title; }
    if (base === 'page') { const p = pages[suffix === 'about' ? 'about' : suffix === 'faq' ? 'faq' : suffix === 'contact' ? 'contact' : suffix === 'shipping' ? 'shipping-returns' : suffix === 'inside' ? 'inside-the-book' : 'about']; s.page = { ...p, template_suffix: suffix || null }; s.page_title = p.title; s.request.path = p.url; }
    if (base === 'search') { s.search = { performed: true, terms: 'popcorn', results: [product], results_count: 1, types: ['product'] }; }
    if (base === '404') { s.page_title = '404 Not Found'; }
    if (base === 'blog' || base === 'article') {
      const art = { id: 1, title: 'Notes from the tape deck', handle: 'notes', url: '/blogs/news/notes', author: 'The editors', published_at: '2026-10-13', created_at: '2026-10-13', excerpt: '<p>Short excerpt.</p>', content: lorem, image: null, tags: ['notes'], comments_count: 0, comments_enabled: false };
      s.blog = { id: 1, title: 'News', handle: 'news', url: '/blogs/news', articles: [art, { ...art, id: 2, title: 'Second post' }], articles_count: 2, tags: ['notes'] };
      s.article = art;
    }
    if (base === 'gift_card') { s.gift_card = { code: 'ABCD EFGH IJKL MNOP', balance: 100000, initial_value: 100000, currency: 'INR', enabled: true, expired: false, expires_on: null, pass_url: '#', qr_identifier: 'x', customer: null }; s.recipient = null; }
    if (base === 'password') { s.shop = { ...shop, password_message: 'Opening soon.' }; }
    return s;
  },
};
