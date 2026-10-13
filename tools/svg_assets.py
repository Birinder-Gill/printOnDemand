"""Vector assets for the theme, drawn with the book's own cover kit so the store and the book match exactly.
   python3 tools/svg_assets.py
-> theme/assets/logo-90s.svg (holographic die-cut 90s sticker), seal-gift.svg (gold seal),
   st-<name>.svg (28 die-cut 90s object stickers), hero-grid.svg (the cover's crossword mosaic, 16 x 21 cells)."""
import json, math, os, subprocess, sys

GIFT = '/home/claude/gift'
sys.path.insert(0, GIFT)
os.chdir(GIFT)
import kit, ink                                  # noqa: E402
from pages import coverkit as ck                 # noqa: E402
from pages import cover_front as cf              # noqa: E402
from prims import f                              # noqa: E402

THEME = '/home/claude/store/theme'
A = f'{THEME}/assets'
INK, PAPER = ck.INK, ck.PAPER


def bboxes(frags):
    """Exact bounding boxes (with a margin for strokes) of SVG fragments, measured in Chromium."""
    html = '<!doctype html><html><body>' + ''.join(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="overflow:visible"><g id="g{i}">{s}</g></svg>' for i, s in enumerate(frags)) + '</body></html>'
    p = '/tmp/claude-0/bbox.html'
    os.makedirs('/tmp/claude-0', exist_ok=True)
    open(p, 'w').write(html)
    js = ("const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});"
          "const pg=await b.newPage();await pg.goto('file://" + p + "');const r=await pg.evaluate(n=>{const o=[];for(let i=0;i<n;i++){const bb=document.getElementById('g'+i).getBBox();o.push([bb.x,bb.y,bb.width,bb.height]);}return o;}," + str(len(frags)) + ");"
          "console.log(JSON.stringify(r));await b.close();})();")
    out = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    if out.returncode:
        raise SystemExit(out.stderr)
    return json.loads(out.stdout)


def write(name, inner, box, pad):
    x, y, w, h = box
    vb = f'{f(x - pad)} {f(y - pad)} {f(w + 2 * pad)} {f(h + 2 * pad)}'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{f(w + 2 * pad)}" height="{f(h + 2 * pad)}">{inner}</svg>'
    open(f'{A}/{name}', 'w').write(svg)
    return len(svg)


# 1. the holographic 90s sticker, as on the front cover
size = ink.size_for('titan-one', '90s', 6.15 * ck.P)
s90, w90, cap90 = ck.word_sticker('h90', '90s', 'titan-one', 400, size, 0, 0, -7, 14, (6.5, 7.5), (6, 8),
                                  sparkles=((-150, -60, 15), (40, -95, 10), (165, -10, 12)))
# 2. the gold seal
seal = cf.seal(0, 0, 57, rot=8)
# 3. stickers, each in its 100-unit box
names = list(ck.ICONS)
stickers = [ck.DEFS + ck.sticker(n, 50, 50, 100, 0, die=4.2, shadow=(2.2, 3.0)) for n in names]
bb = bboxes([s90, seal] + stickers)
sizes = {'logo-90s.svg': write('logo-90s.svg', s90, bb[0], 3), 'seal-gift.svg': write('seal-gift.svg', seal, bb[1], 2)}
for n, s, b in zip(names, stickers, bb[2:]):
    sizes[f'st-{n}.svg'] = write(f'st-{n}.svg', s, b, 1.5)

# 4. the hero mosaic: 16 x 21 cells of 100 units on ink, colours, Memphis motifs, halftones and stickers
COLS, ROWS, C = 16, 21, 100.0
GAP = C * ck.G / ck.P
BGS = [ck.TEAL, ck.PURPLE, ck.MAGENTA, ck.YELLOW, ck.ORANGE]
r = ck.RNG(1996)
cells = {}
icons = [n for n in cf.ICON_ORDER]
ik = 0
o = [ck.DEFS, f'<rect width="{COLS * C}" height="{ROWS * C}" fill="{INK}"/>']
for j in range(ROWS):
    for i in range(COLS):
        near = {cells.get((i - 1, j), (None,))[0], cells.get((i, j - 1), (None,))[0], cells.get((i - 1, j - 1), (None,))[0], cells.get((i + 1, j - 1), (None,))[0]}
        kind = r.choices(['plain', 'motif', 'icon', 'ink'], [.36, .30, .16, .18])[0]
        if kind == 'ink':
            cells[(i, j)] = (INK, 'ink', None)
            continue
        bg = r.choice([c for c in BGS if c not in near] or BGS)
        name = None
        if kind == 'icon':
            # pick the next sticker whose own colours differ from the cell
            for _ in range(len(icons)):
                cand = icons[ik % len(icons)]
                ik += 1
                if bg not in ck.ICON_COLS.get(cand, ()):
                    name = cand
                    break
            if not name:
                kind = 'plain'
        elif kind == 'motif':
            name = r.choice(list(ck.MOTIFS))
        cells[(i, j)] = (bg, kind, name)
        x, y = i * C, j * C
        s = C - GAP
        o.append(f'<rect x="{f(x + GAP / 2)}" y="{f(y + GAP / 2)}" width="{f(s)}" height="{f(s)}" fill="{bg}"/>')
        cid = f'hc{i}_{j}'
        if kind == 'plain' and r.random() < .5:
            o.append(f'<clipPath id="{cid}"><rect x="{f(x + GAP / 2)}" y="{f(y + GAP / 2)}" width="{f(s)}" height="{f(s)}"/></clipPath><g clip-path="url(#{cid})">'
                     + cf.halftone(x + GAP / 2, y + GAP / 2, s, cf.shade(bg, .82), r, r.choice(((0, 0), (1, 0), (0, 1), (1, 1)))) + '</g>')
        elif kind == 'motif':
            fg = INK
            o.append(f'<clipPath id="{cid}"><rect x="{f(x + GAP / 2)}" y="{f(y + GAP / 2)}" width="{f(s)}" height="{f(s)}"/></clipPath>'
                     f'<g clip-path="url(#{cid})"><g transform="translate({f(x)} {f(y)})">{ck.MOTIFS[name](fg, r)}</g></g>')
        elif kind == 'icon':
            o.append(ck.sticker(name, x + C / 2, y + C / 2, C * .78, r.uniform(-9, 9), die=3.2 * C / 62 * .78 / .78, shadow=(1.6 * C / 62, 2.0 * C / 62)))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(COLS * C)} {f(ROWS * C)}" width="{f(COLS * C)}" height="{f(ROWS * C)}" preserveAspectRatio="xMinYMin slice">{"".join(o)}</svg>'
open(f'{A}/hero-grid.svg', 'w').write(svg)
sizes['hero-grid.svg'] = len(svg)
json.dump({k: v for k, v in cells.items()} and {f'{i},{j}': list(v) for (i, j), v in cells.items()}, open('/home/claude/store/tools/hero-grid-cells.json', 'w'))
for k, v in sizes.items():
    if k.startswith('st-'):
        continue
    print(k, round(v / 1024, 1), 'KB')
print(len(names), 'stickers, avg', round(sum(v for k, v in sizes.items() if k.startswith('st-')) / len(names) / 1024, 1), 'KB')
