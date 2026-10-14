"""Build every image the store uploads, from the 3D renders (work/r3d/final) and the page renders (work/pages).
   python3 tools/media.py [product] [files]
-> media/product/NN-name.jpg   square 2048 product photos on colour sweeps
   media/files/nac-*.jpg|png    images for theme sections (Shopify Files)"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

WORK = '/home/claude/work'
R3D = f'{WORK}/r3d/final'
PAGES = f'{WORK}/pages'
OUT = '/home/claude/store/media'
os.makedirs(f'{OUT}/product', exist_ok=True)
os.makedirs(f'{OUT}/files', exist_ok=True)

C = {'grape': (106, 52, 200), 'magenta': (255, 47, 142), 'teal': (0, 169, 157), 'sun': (255, 210, 31), 'tangerine': (255, 106, 31),
     'sky': (56, 198, 244), 'ink': (36, 28, 52), 'lime': (181, 230, 29), 'paper': (255, 247, 228)}


def sweep(size, col, glow=.22, edge=.78, seed=3):
    """A studio colour sweep: lighter behind the subject, falling off to the edges, fine grain against banding."""
    w, h = size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * .5, h * .42
    d = np.sqrt(((x - cx) / (w * .62)) ** 2 + ((y - cy) / (h * .62)) ** 2)
    t = np.clip(d, 0, 1.25)
    base = np.array(col, np.float32)
    light = base + (255 - base) * glow
    dark = base * edge
    k = np.clip(t / 1.1, 0, 1)[..., None]
    img = light * (1 - k) + dark * k
    # floor: a touch darker toward the bottom
    f = np.clip((y - h * .62) / (h * .38), 0, 1)[..., None]
    img = img * (1 - .07 * f)
    rng = np.random.default_rng(seed)
    img += rng.normal(0, 2.2, (h, w, 1)).astype(np.float32)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')


def alpha_bbox(im, thr=40):
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > thr)
    return xs.min(), ys.min(), xs.max(), ys.max()


def place(render, size, col, fill=.8, cy=.53, cx=.5, glow=.22, edge=.78):
    """Scale the subject (the opaque part, shadow excluded) to `fill` of the frame and centre it."""
    im = Image.open(render).convert('RGBA')
    x0, y0, x1, y1 = alpha_bbox(im, 200)
    sw, sh = x1 - x0, y1 - y0
    W, H = size
    s = min(W * fill / sw, H * fill / sh)
    im2 = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    bg = sweep(size, C[col], glow, edge).convert('RGBA')
    ox = round(W * cx - (x0 + sw / 2) * s)
    oy = round(H * cy - (y0 + sh / 2) * s)
    bg.alpha_composite(im2, (ox, oy)) if ox >= 0 and oy >= 0 else bg.paste(im2, (ox, oy), im2)
    return bg.convert('RGB')


def flat_cover(src, size, col, fill=.82):
    """The board flat on, with a soft drop shadow."""
    cov = Image.open(src).convert('RGB')
    W, H = size
    s = H * fill / cov.height
    cov = cov.resize((round(cov.width * s), round(cov.height * s)), Image.LANCZOS)
    bg = sweep(size, C[col]).convert('RGBA')
    ox, oy = (W - cov.width) // 2, (H - cov.height) // 2
    sh = Image.new('L', size, 0)
    sh.paste(255, (ox + 18, oy + 28, ox + cov.width + 18, oy + cov.height + 28))
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    shadow = Image.new('RGBA', size, (20, 10, 40, 0))
    shadow.putalpha(sh.point(lambda v: int(v * .42)))
    bg.alpha_composite(shadow)
    bg.paste(cov, (ox, oy))
    # a faint sheen across the laminate
    gl = Image.new('L', cov.size, 0)
    g = np.linspace(0, 1, cov.width)[None, :] * np.ones((cov.height, 1))
    band = np.exp(-((g - .32) / .16) ** 2) * 22
    gl = Image.fromarray(band.astype(np.uint8), 'L')
    white = Image.new('RGBA', cov.size, (255, 255, 255, 0))
    white.putalpha(gl)
    bg.alpha_composite(white, (ox, oy))
    return bg.convert('RGB')


def trim_page(n):
    """A book page cut to the trim (bleed removed): outer edge is left on even pages, right on odd pages."""
    im = Image.open(f'{PAGES}/p-{n:02d}.png').convert('RGB')
    b = round(im.width / 8.375 * .125)
    if n % 2 == 0:
        return im.crop((b, b, im.width, im.height - b))
    return im.crop((0, b, im.width - b, im.height - b))


def spread(l, r, width=1600, gutter=True):
    L, R = trim_page(l), trim_page(r)
    h = L.height
    S = Image.new('RGB', (L.width + R.width, h), 'white')
    S.paste(L, (0, 0))
    S.paste(R, (L.width, 0))
    if gutter:
        a = np.zeros((h, S.width), np.float32)
        x = np.arange(S.width, dtype=np.float32)
        gx = L.width
        dist = np.abs(x - gx) / S.width
        shade = np.exp(-dist / .018) * .30 + np.exp(-dist / .07) * .08
        a[:] = shade[None, :]
        arr = np.array(S, np.float32) * (1 - a[..., None])
        S = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    s = width / S.width
    return S.resize((width, round(S.height * s)), Image.LANCZOS)


def cut(render, out, width, thr=8):
    """A transparent render cropped to its content (shadow kept), for sections that place it on their own art."""
    im = Image.open(render).convert('RGBA')
    x0, y0, x1, y1 = alpha_bbox(im, thr)
    pad = 12
    im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    s = width / im.width
    im = im.resize((width, round(im.height * s)), Image.LANCZOS)
    im.save(out, optimize=True)


which = sys.argv[1:] or ['product', 'files']
S2 = (2048, 2048)
if 'product' in which:
    P = f'{OUT}/product'
    place(f'{R3D}/r_hero.png', S2, 'grape', fill=.80, cy=.52).save(f'{P}/01-hardcover.jpg', quality=88, optimize=True, progressive=True)
    flat_cover(f'{WORK}/tex/front300_board.png', S2, 'ink').save(f'{P}/02-front-cover.jpg', quality=90, optimize=True, progressive=True)
    place(f'{R3D}/r_open_12_13.png', S2, 'teal', fill=.9, cy=.5).save(f'{P}/03-inside-saturday-morning.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_duo.png', S2, 'sun', fill=.84, cy=.52).save(f'{P}/04-front-and-back.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_open_42_43.png', S2, 'magenta', fill=.9, cy=.5).save(f'{P}/05-inside-press-start.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_open_02_03.png', S2, 'sky', fill=.9, cy=.5).save(f'{P}/06-inside-autograph-page.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_flat.png', S2, 'tangerine', fill=.80, cy=.5).save(f'{P}/07-flat.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_open_62_63.png', S2, 'grape', fill=.9, cy=.5).save(f'{P}/08-inside-extra-extra.jpg', quality=88, optimize=True, progressive=True)
    place(f'{R3D}/r_open_66_67.png', S2, 'teal', fill=.9, cy=.5).save(f'{P}/09-inside-cheat-codes.jpg', quality=88, optimize=True, progressive=True)
    flat_cover(f'{WORK}/tex/back300_bc.png', S2, 'magenta').save(f'{P}/10-back-cover.jpg', quality=90, optimize=True, progressive=True)
    place(f'{R3D}/r_spine.png', S2, 'ink', fill=.80, cy=.52).save(f'{P}/11-spine.jpg', quality=88, optimize=True, progressive=True)
    print('product images:', sorted(os.listdir(P)))

if 'files' in which:
    F = f'{OUT}/files'
    # the hero book, transparent, with its contact shadow
    cut(f'{R3D}/r_hero_nogr.png', f'{F}/nac-hero-book.png', 1300)
    cut(f'{R3D}/r_hero_fore.png', f'{F}/nac-book-fore.png', 1300)
    cut(f'{R3D}/r_flat.png', f'{F}/nac-book-flat.png', 1500)
    for l, r in ((2, 3), (6, 7), (12, 13), (26, 27), (40, 41), (42, 43), (58, 59), (62, 63), (64, 65), (66, 67)):
        cut(f'{R3D}/r_open_{l:02d}_{r:02d}.png', f'{F}/nac-open-{l:02d}-{r:02d}.png', 1600)
    # puzzle pages: design visible, clues not practically printable
    import json
    D = json.load(open('/home/claude/90s_crossword_puzzles.json'))
    off = {}
    for pz in D['puzzles']:
        i = pz['id']
        page = i + (7 if i <= 8 else 9 if i <= 16 else 11 if i <= 28 else 13 if i <= 32 else 15 if i <= 42 else 17)
        im = trim_page(page)
        im.thumbnail((700, 940), Image.LANCZOS)
        im.save(f'{F}/nac-pz-{i:02d}.jpg', quality=84, optimize=True, progressive=True)
    # flat spreads: section openers (TV screen) and the flipbook
    for l, r in ((6, 7), (16, 17), (26, 27), (40, 41), (46, 47), (58, 59)):
        spread(l, r, 1500).save(f'{F}/nac-opener-{l:02d}-{r:02d}.jpg', quality=85, optimize=True, progressive=True)
    for l, r in ((2, 3), (4, 5), (8, 9), (12, 13), (14, 15), (18, 19), (22, 23), (24, 25), (34, 35), (42, 43), (50, 51), (62, 63), (64, 65), (66, 67)):
        spread(l, r, 1500).save(f'{F}/nac-spread-{l:02d}-{r:02d}.jpg', quality=85, optimize=True, progressive=True)
    # single pages used as artwork
    for n in (1, 3, 4, 5, 66, 67, 80):
        im = trim_page(n)
        im.thumbnail((900, 1200), Image.LANCZOS)
        im.save(f'{F}/nac-page-{n:02d}.jpg', quality=85, optimize=True, progressive=True)
    # covers, flat
    for src, name in ((f'{WORK}/tex/front300_board.png', 'nac-cover-front.jpg'), (f'{WORK}/tex/back300_bc.png', 'nac-cover-back.jpg')):
        im = Image.open(src).convert('RGB')
        if 'back' in name:
            b = round(.125 * 300)
            im = im.crop((b, b, im.width - b, im.height - b))
        im.thumbnail((1200, 1600), Image.LANCZOS)
        im.save(f'{F}/{name}', quality=88, optimize=True, progressive=True)
    tot = sum(os.path.getsize(f'{F}/{x}') for x in os.listdir(F))
    print(len(os.listdir(F)), 'files,', round(tot / 1024 / 1024, 1), 'MB')
