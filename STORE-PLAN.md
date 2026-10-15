# Quiet Hour Press: Shopify store plan

**Direction change (user, 14 Oct 2026):** the store is no longer a one-product site. It is **Quiet Hour Press**, a press
selling puzzle and gift books; *90s America Crossword* is product No. 001. One page per product. The store shell is
**loud brutalism** in the **Primary** palette. The crossword's page keeps its handcrafted 90s sections inside the
brutalist frame ("a product with its own packaging"). The original brief below still applies to those 90s sections.

## Brutalist system (store shell)
- Tokens in `assets/qh.css` (`--q-*`): paper #f2eee3, white #fffdf7, ink #0d0d0d, red #ff2a1f, cobalt #1f3bff,
  yellow #ffd400. 3px ink rules (2.5px on phones), hard offset shadows (8px / 6px), zero radius.
- Type: Archivo variable (wdth 125 + wght 900 for display, uppercase, tight leading), Archivo body,
  Space Mono 700 for labels, numbers and prices.
- Color schemes `.qs-paper|white|ink|red|blue|yellow` set --bg/--fg/--line/--hi; sections pick one in settings.
  Red takes ink text, cobalt takes white text (contrast). Red never carries small text on paper.
- Components: `.q-btn` (yellow, ink border, hard shadow that collapses on press), `.q-card` (numbered product card,
  `snippets/qh-card.liquid`), `.q-tag`, `.q-stamp`, `.q-acc` accordion, `.q-inline` input+button bar, `.q-qty`,
  `.q-marquee`, `.q-crumbs`, `.q-intro` page band, `.q-rte`. `[brackets]` in display text = boxed highlight
  (`snippets/qh-hl.liquid`). Logo: clock face with one hour (12 to 1) cut out in red (`snippets/qh-logo.liquid`).
- Product data per book (metafields, namespace custom): catalog_number ("001"), tagline, cutout (transparent image
  for color panels), highlights (multi-line), specs (multi-line "Label: Value").
- Chrome: qh-announce (mono crawl), qh-header (ruled cells; phone menu = cobalt index), cart-drawer (ruled slab,
  section id must stay `cart-drawer`), qh-signup (newsletter band, id #signup), qh-footer (giant SVG wordmark).
- Home: qh-hero (clock + featured book), qh-marquee, qh-catalog (+ honest "in the works" tiles), qh-spotlight,
  qh-rules, qh-statement.
- Products: `product.json` = reusable brutalist book page (qh-product, qh-story, qh-marquee, qh-faq, qh-related;
  qh-pages "Look inside" is available to add). Each new book gets its own `product.<handle>.json` built from it.
  `product.90s-crossword.json` = qh-world placard + the 90s sections (hero grid, blister card, flipbook, channels,
  binder, game show, track list, facts, cheats, yearbook, manual, notes, order form, infomercial) + qh-related.
- Store templates: cart (qh-cart-page), collection (qh-collection), list-collections, search, 404, password,
  page, page.about (the press), page.contact, page.faq, page.shipping, blog, article, gift_card: all brutalist.
  Crossword sub-pages keep their 90s design under a qh-world placard: page.inside (video store), page.liner
  (liner notes, moved from page.about).

## Original brief (90s America Crossword)
The brief (user, 13 Oct 2026): build the Shopify store for the premium hardcover gift edition of *90s America Crossword:
The Throwback Puzzle Book*. Loud retro vibe, "do not hold back". A unique theme and design language for every section.
Real expensive vibe: every section and page should look handcrafted with precision, as if it took its time. Quality over
speed on every page, however many sessions it takes.

## How to resume in a new session (READ FIRST)
1. Get this branch to `/home/claude/store` (every tool uses that path):
   - Claude Code session opened on the repo `Birinder-Gill/printOnDemand`: `git fetch origin crossword-store &&
     git checkout crossword-store`, then `mkdir -p /home/claude && ln -sfn "$(git rev-parse --show-toplevel)" /home/claude/store`.
   - Any other session: attach the repo (access "push"), then
     `git clone --depth 1 -b crossword-store https://github.com/Birinder-Gill/printOnDemand /home/claude/store`.
   - No GitHub? Unzip the newest `90s-store-backup*.zip` the user attaches into /home/claude so you get /home/claude/store.
   The branch holds only store files; the user approved it for hosting store images, the theme source and this plan.
   If pushing to `crossword-store` is refused in your session, push to the branch you are allowed to use and pin raw
   URLs to that commit instead (raw URLs work for any pushed commit).
2. `sh /home/claude/store/tools/setup_work.sh` (preview harness, 3D tools, local servers on :8765 and :8777, and the book
   project from the user's newest `*gift-backup*.zip` if one is attached; book images are only needed to rebuild media/).
   Playwright is found by tools/pw.cjs (local, global npm, or `npm i -g playwright`); Chromium from /opt/pw-browsers if present.
   Servers die when a session idles: restart with the two `http.server` lines from setup_work.sh.
3. Read "Status" below, then continue with the first unchecked item. Shopify connector: "My Store 10"
   (i7d9cn-v1.myshopify.com), currency INR ("Rs. {{amount}}"), trial plan, Horizon is live. Our theme is a separate,
   unpublished theme (the connector cannot publish or write the live theme; the user clicks Publish in admin).
4. Checkpoint after every finished section or page: `python3 tools/backup.py "what changed"` (commits, pushes, writes
   /home/claude/90s-store-backup.zip), update Status here, and send the user the zip at milestones. Never end a session
   without a checkpoint. The user asked for this explicitly (13 Oct).

## Infrastructure
- The workspace cannot reach Shopify hosts or Google storage. Shopify fetches files by URL instead: push files to this
  branch, then use raw URLs pinned to a commit SHA: `https://raw.githubusercontent.com/Birinder-Gill/printOnDemand/<sha>/<path>`.
  - Images -> Shopify Files via `fileCreate` (originalSource = raw URL, filename set). Theme sections reference them as
    `shopify://shop_images/<filename>` in JSON templates (image_picker settings), so the merchant can swap them.
  - Product media -> `productCreateMedia` / `productUpdate` media with raw URLs.
  - Theme -> `themeCreate(source: raw URL of dist/theme.zip)` once, then `themeFilesUpsert` with body type URL (raw file
    URLs at the new SHA) for changed files (max 50 files per call).
- Preview: `tools/preview` renders the theme locally with LiquidJS + mocks of the Shopify objects, then screenshots with
  Playwright (desktop 1440 and mobile 390). Every section is checked this way before it ships.

## Design system (shared)
Palette (from the book cover): ink #17131f, paper #fff7e4, grape #6a34c8, magenta #ff2f8e, sun #ffd21f, tangerine #ff6a1f,
teal #00a99d, lime #b5e61d, sky #38c6f4. Holo foil stops #ffb3e4 #ffe8a3 #b8ffd6 #9fe6ff #c8b4ff. Gold foil #fff2b3 #f2c33b #c38a14 #ffe28a.
Type: Archivo (variable width + weight) for all body and UI copy; Archivo Black for crossword tiles; Knewave for brushed
taglines. Each section adds the face its artifact would really use (VCR on-screen display, LCD segments, marquee, etc.).
Constant across the site: the big yellow "Add to cart" button (sun fill, ink border, hard ink shadow that collapses on
press), magenta focus rings, sentence-case button labels, Archivo body at 17-18 px / 1.55.
Rules: no real brand logos or trade dress; no fake reviews, ratings, scarcity or countdowns; no answers of the book shown
in art (sample clues on the site are marketing, their answers are only revealed on request); reduced motion respected;
every interactive thing works by keyboard.

## Pages and sections (each line = its own design language)
Global
- Ticker: 1992 newscast crawl (blue gradient bar, red NEW bug, condensed caps crawl, time and temperature).
- Header: blister-card hang tab (glossy grape card, euro hang hole die-cut, holo 90s logo sticker, price-gun cart sticker).
- Mobile menu: holographic sticker sheet; nav items are die-cut stickers.
- Cart drawer: thermal receipt from a toy store register (perforated tear edge, dot-matrix type, big register key).
- Footer: VCR blue screen at the end of the tape ("Be kind, rewind.", on-screen menu links).
Home
1. Hero, "The cover, unfolded": the cover's crossword grid spreads over the screen; CROSSWORD across, AMERICA down in paper
   tiles typed in once on load; holographic 90s sticker that reacts to the pointer; gold seal; the 3D hardcover; clue panel
   with price and Add to cart.
2. Channel lineup: late-night living room, CRT TV with letterboxed opener spreads, remote with channels 1-6, static between
   channels, TV-listings card with the section's topics.
3. No two pages alike: trading-card binder, 9-pocket sleeves, 48 holo cards (the puzzle pages), checklist on the left page,
   cards flip to a stats back (category, clues, hints, design notes).
4. Try a clue: game show stage, marquee bulbs, three LED podiums with real clues and answer squares, hint as a lifeline.
5. Puzzle facts: cereal-box side panel with a nutrition-facts style label for the book's specs.
6. Cheat codes: 90s game magazine codes page; enter the button code for a surprise.
7. Sign it like a yearbook: yearbook autograph page in gel pens; the book's real gift page.
8. But wait, there's more: late-night infomercial end card, final price and Add to cart.
9. Pager: email signup on a pager LCD clipped to a denim pocket.
Product
1. Main: blister-carded toy on a pegboard: gallery in the clear bubble, buy box on the printed card ("Ages 30 and up").
2. Look inside: page-turn flipbook under a reading lamp (the quiet, expensive moment).
3. Track list: the 48 puzzles as a mixtape J-card in ballpoint and marker.
4. Operating instructions: owner's-manual page with FIG. 1 and the specs on a model plate.
5. Notes passed in class: FAQ as folded notebook notes.
6. Shipping and returns as a mail-order form.
Other templates
- Inside the book (page.inside): video-store wall, a shelf per section, tapes you can pull out.
- About (page.about): CD booklet liner notes.
- FAQ (page.faq), Contact (page.contact: "While You Were Out" message slip + answering machine), Shipping (page.shipping).
- Cart: the receipt, full size. Collection: holiday toy catalog page circled in red crayon. List collections: mall directory.
- Search: library card catalog. 404: no signal. Password: homemade "under construction" web page with a guestbook.
- Blog/article: photocopied zine. Gift card: arcade game card. Generic page: composition notebook.

## Status (Quiet Hour Press rebuild, 14-15 Oct 2026)
- [x] Brutalist design system, chrome, home, product templates, all store templates (see "Brutalist system" above).
- [x] Theme "Quiet Hour Press" = gid://shopify/OnlineStoreTheme/189145809049 (renamed from "90s America Crossword:
      Throwback"), UNPUBLISHED. All new/changed files upserted from commit 7904f89; every JSON template verified
      against the repo after upload (no dropped sections). themeFilesDelete is blocked by the connector: the 51 retired
      files are still on the theme but unused; the 4 retired sections that had presets were overwritten with empty
      stubs so they don't show in "Add section". The user can delete the rest in the code editor (optional).
- [x] Store data: product metafield definitions custom.catalog_number / tagline / cutout / highlights / specs (pinned);
      crossword filled in (No. 001, cutout = nac-hero-book.png), vendor "Quiet Hour Press", templateSuffix
      "90s-crossword". Smart collection "The Catalog" (handle all, price > 0, newest first) published to Online Store.
      Pages: about (press, template about), liner-notes (new, template liner, old liner notes copy), contact and
      shipping-returns copy rewritten for the press. Main menu: Catalog, 90s Crossword, About, FAQ, Contact.
- [ ] Multi-agent code review of the theme (5 dimensions + adversarial verify), then fixes, re-upload, checkpoint.
- [ ] Real-store check is the user's (workspace can't open the storefront): Online Store > Themes > Quiet Hour Press >
      Preview. Then Publish.
- [ ] User to-dos (tell them, don't do): rename the store from "My Store 10" to Quiet Hour Press (Settings > General);
      currency (INR now); policies (refund, shipping, privacy, terms); payments and shipping rates; password message;
      list the other books (title, price, images, catalog number) so each gets its own product page/template.

## Status (original 90s build, kept for history)
- [x] Render book images (covers, pages, 3D renders, spreads)
- [x] Theme skeleton, design tokens, fonts, preview harness
- [x] Global chrome
- [x] Home sections 1-9
- [x] Product sections 1-6
- [x] Other templates: cart (checkout counter), page.about (CD liner notes), page.contact (message slip + answering
      machine), page.faq (school hallway + notes), page.shipping (parcel + order form), page.inside (video store),
      page (composition notebook), collection (toy catalog), list-collections (mall directory), search (card catalog),
      404 (handheld GAME OVER), password (under-construction homepage), blog/article (zine), gift_card (arcade card)
- [x] theme-check (@shopify/theme-check-node in /home/claude/tc, `node run.mjs`): clean except one preload suggestion
- [x] Store content (14 Oct): 90 files (in Files, names nac-*), metaobject definition "puzzle" + 48 entries
      (file ids in data/puzzle-file-ids.json), product gid://shopify/Product/15425883046041 (Rs. 3,999, ACTIVE,
      published to Online Store), collection "The Gift Shop" (gift-shop), pages about/faq/shipping-returns/
      inside-the-book (+ contact updated), main + footer menus.
- [x] Theme installed (14 Oct): "90s America Crossword: Throwback", gid://shopify/OnlineStoreTheme/189145809049,
      UNPUBLISHED. All 185 theme files are on it (verified file list; every JSON template matches the repo).
      Lesson: Shopify silently drops a section whose schema has `"default": ""` on a text setting, and then every
      template using that section (that happened to s-notes -> product.json, page.faq.json; fixed in a3ec34d).
      Update files later with themeFilesUpsert (body type URL, raw URL at the new SHA, max 50 per call); it only works
      while this theme is unpublished, so finish fixes before the user publishes, or duplicate the live theme first.
- [x] Local QA: every template rendered with the LiquidJS harness at 1440 and 390 and screenshotted.
- [ ] The workspace cannot open the storefront (Shopify hosts are blocked, and the trial store is password-protected),
      so the real-store check is the user's: Online Store > Themes > "90s America Crossword: Throwback" > Preview.
      Fix anything they report, then they click Publish.
- [ ] User to-dos (tell them, don't do): pick a plan (trial), set store currency (INR now; switch before the first sale
      if selling in USD), rename the store from "My Store 10" (Settings > General), add store policies (refund, shipping,
      privacy, terms: the theme links to them), set up payments and shipping rates, publish the theme.
      The 3D renders use a stand-in spine design until the real KDP wrap is done.

## Pipelines
- `tools/shot.cjs in.html out.png W H [scale] [transparent]`: HTML to PNG with local fonts.
- 3D renders: `work/r3d/book.html` (three.js 0.169, served from a local http server at :8765 rooted at the work dir),
  `render3d.cjs "query" out.png size [aspect]`. Shots: hero (ry, cy, ly, cz), front, flat (rz), duo, spine, open (l, r = page
  PNGs). Covers come from gift/out/cover-front.pdf and cover-back.pdf at 300 dpi (tex/front300.png, back300_bc.png with a
  generic barcode in the KDP box); spine texture from work/spine/spine.html (a stand-in until the real spine is designed).
