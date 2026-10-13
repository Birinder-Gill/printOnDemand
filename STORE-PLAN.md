# 90s America Crossword: Shopify store plan

The brief (user, 13 Oct 2026): build the Shopify store for the premium hardcover gift edition of *90s America Crossword:
The Throwback Puzzle Book*. Loud retro vibe, "do not hold back". A unique theme and design language for every section.
Real expensive vibe: every section and page should look handcrafted with precision, as if it took its time. Quality over
speed on every page, however many sessions it takes.

## How to resume in a new session (READ FIRST)
1. Attach the GitHub repo `Birinder-Gill/printOnDemand` (add_repo, access "push"), then
   `git clone --depth 1 -b crossword-store https://github.com/Birinder-Gill/printondemand /home/claude/store`.
   (No GitHub? Unzip the newest `90s-store-backup*.zip` from /root/.claude/uploads/*/ to /home/claude so you get /home/claude/store.)
   The branch holds only store files; the user approved it for hosting store images, the theme source and this plan.
2. `sh /home/claude/store/tools/setup_work.sh` (preview harness, 3D tools, local servers on :8765 and :8777, and the book
   project from the user's newest `*gift-backup*.zip` if one is attached; book images are only needed to rebuild media/).
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

## Status
- [ ] Render book images (covers, pages, 3D renders, spreads)
- [ ] Theme skeleton, design tokens, fonts, preview harness
- [ ] Global chrome
- [ ] Home sections 1-9
- [ ] Product sections 1-6
- [ ] Other templates
- [ ] Publish (files, theme, product, pages, menus)
- [ ] QA every page at 1440 and 390, theme-check, Shopify upsert errors

## Pipelines
- `tools/shot.cjs in.html out.png W H [scale] [transparent]`: HTML to PNG with local fonts.
- 3D renders: `work/r3d/book.html` (three.js 0.169, served from a local http server at :8765 rooted at the work dir),
  `render3d.cjs "query" out.png size [aspect]`. Shots: hero (ry, cy, ly, cz), front, flat (rz), duo, spine, open (l, r = page
  PNGs). Covers come from gift/out/cover-front.pdf and cover-back.pdf at 300 dpi (tex/front300.png, back300_bc.png with a
  generic barcode in the KDP box); spine texture from work/spine/spine.html (a stand-in until the real spine is designed).
