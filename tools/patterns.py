"""Seamless background tiles for the theme (SVG). Each shape is drawn 9 times (offset by +-tile) so the tile wraps.
   python3 tools/patterns.py  -> theme/assets/pat-*.svg
"""
import random, math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'theme', 'assets')


def wrap(frag, x, y, T):
    out = []
    for dx in (-T, 0, T):
        for dy in (-T, 0, T):
            nx, ny = x + dx, y + dy
            if -40 < nx < T + 40 and -40 < ny < T + 40:
                out.append(frag.format(x=round(nx, 1), y=round(ny, 1)))
    return out


def save(name, T, bg, frags):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{T}" height="{T}" viewBox="0 0 {T} {T}"><rect width="{T}" height="{T}" fill="{bg}"/>{"".join(frags)}</svg>'
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(svg)
    print(name, len(svg) // 1024, 'KB')


def laminate():
    """Toy-store counter top: off-white Formica with confetti chips and grey speckle."""
    r = random.Random(1993)
    T = 240
    frags = []
    # grey speckle first
    for _ in range(170):
        x, y = r.uniform(0, T), r.uniform(0, T)
        rad = r.choice([.8, 1, 1.2, 1.5])
        c = r.choice(['#b9b3a6', '#cfc8ba', '#9e978a'])
        frags += wrap(f'<circle cx="{{x}}" cy="{{y}}" r="{rad}" fill="{c}"/>', x, y, T)
    cols = ['#00a99d', '#ff2f8e', '#6a34c8', '#ffd21f', '#38c6f4', '#ff6a1f']
    # chips: short dashes, tiny triangles, little squiggles, rings
    pts = []
    def ok(x, y, d=20):
        return all((min(abs(x - a), T - abs(x - a)) ** 2 + min(abs(y - b), T - abs(y - b)) ** 2) > d * d for a, b in pts)
    n = 0
    while n < 36:
        x, y = r.uniform(0, T), r.uniform(0, T)
        if not ok(x, y):
            continue
        pts.append((x, y)); n += 1
        c = r.choice(cols)
        a = r.uniform(0, 180)
        kind = r.choices(['dash', 'tri', 'squig', 'ring', 'dot'], [5, 2, 2, 1.5, 2])[0]
        if kind == 'dash':
            L = r.uniform(7, 12)
            frag = f'<path d="M{-L/2:.1f} 0h{L:.1f}" stroke="{c}" stroke-width="3" stroke-linecap="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'tri':
            s = r.uniform(5, 7)
            frag = f'<path d="M0 {-s:.1f}L{s*.87:.1f} {s/2:.1f}H{-s*.87:.1f}Z" fill="{c}" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'squig':
            frag = f'<path d="M-8 0q2-4 4 0t4 0 4 0 4 0" fill="none" stroke="{c}" stroke-width="2.4" stroke-linecap="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'ring':
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="3.6" fill="none" stroke="{c}" stroke-width="2.2"/>'
        else:
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="2.6" fill="{c}"/>'
        frags += wrap(frag, x, y, T)
    save('pat-laminate.svg', T, '#f6f1e7', frags)


def wallpaper():
    """Contact page: 90s Memphis wallpaper, mint with black squiggles, magenta triangles and sun dots."""
    r = random.Random(1997)
    T = 320
    frags = []
    pts = []
    def ok(x, y, d):
        return all((min(abs(x - a), T - abs(x - a)) ** 2 + min(abs(y - b), T - abs(y - b)) ** 2) > d * d for a, b in pts)
    kinds = ['squig'] * 7 + ['tri'] * 5 + ['dot'] * 6 + ['bar'] * 4 + ['ring'] * 3
    r.shuffle(kinds)
    for kind in kinds:
        for _ in range(400):
            x, y = r.uniform(0, T), r.uniform(0, T)
            if ok(x, y, 44):
                break
        pts.append((x, y))
        a = r.uniform(0, 180)
        if kind == 'squig':
            frag = f'<path d="M-24 0q6-12 12 0t12 0 12 0 12 0" fill="none" stroke="#17131f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'tri':
            frag = f'<path d="M0 -12L10.4 6H-10.4Z" fill="#ff2f8e" stroke="#17131f" stroke-width="3" stroke-linejoin="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'dot':
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="6" fill="#ffd21f" stroke="#17131f" stroke-width="3"/>'
        elif kind == 'bar':
            frag = f'<rect x="-14" y="-4" width="28" height="8" rx="1" fill="#6a34c8" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        else:
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="9" fill="none" stroke="#ff6a1f" stroke-width="4"/>'
        frags += wrap(frag, x, y, T)
    save('pat-wallpaper.svg', T, '#9ff0d9', frags)


def carpet():
    """Inside page: arcade / cinema carpet. Deep navy with neon squiggles, rings, stars and zigzags."""
    r = random.Random(1989)
    T = 360
    frags = []
    pts = []
    def ok(x, y, d):
        return all((min(abs(x - a), T - abs(x - a)) ** 2 + min(abs(y - b), T - abs(y - b)) ** 2) > d * d for a, b in pts)
    cols = ['#ff2f8e', '#00e0cf', '#ffd21f', '#8d5cf0', '#38c6f4', '#ff6a1f']
    kinds = ['squig'] * 7 + ['ring'] * 4 + ['star'] * 5 + ['zig'] * 5 + ['dot'] * 8 + ['planet'] * 2
    r.shuffle(kinds)
    for kind in kinds:
        for _ in range(500):
            x, y = r.uniform(0, T), r.uniform(0, T)
            if ok(x, y, 40):
                break
        pts.append((x, y))
        c = r.choice(cols)
        a = r.uniform(0, 180)
        if kind == 'squig':
            frag = f'<path d="M-22 0q5.5-11 11 0t11 0 11 0 11 0" fill="none" stroke="{c}" stroke-width="4" stroke-linecap="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'ring':
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="8" fill="none" stroke="{c}" stroke-width="3.5"/>'
        elif kind == 'star':
            pts_s = ' '.join(f'{(9 if i % 2 == 0 else 3.6) * math.cos(math.pi * i / 4):.1f},{(9 if i % 2 == 0 else 3.6) * math.sin(math.pi * i / 4):.1f}' for i in range(8))
            frag = f'<polygon points="{pts_s}" fill="{c}" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'zig':
            frag = f'<path d="M-15 4l6-8 6 8 6-8 6 8 6-8" fill="none" stroke="{c}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" transform="translate({{x}} {{y}}) rotate({a:.0f})"/>'
        elif kind == 'dot':
            frag = f'<circle cx="{{x}}" cy="{{y}}" r="2.6" fill="{c}"/>'
        else:
            frag = f'<g transform="translate({{x}} {{y}}) rotate({a:.0f})"><circle r="9" fill="{c}"/><ellipse rx="17" ry="5" fill="none" stroke="#fff7e4" stroke-width="2.6"/></g>'
        frags += wrap(frag, x, y, T)
    save('pat-carpet.svg', T, '#16103a', frags)


if __name__ == '__main__':
    laminate()
    wallpaper()
    carpet()
