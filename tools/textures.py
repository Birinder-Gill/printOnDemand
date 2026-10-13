"""Textures for the 3D renders: a generic barcode in the KDP barcode box of the back cover, and the spine strip.
   python3 tools/textures.py   (needs work/tex/front300.png and back300.png, 300 dpi renders of the cover PDFs)"""
import random, subprocess
from PIL import Image, ImageDraw

TEX = '/home/claude/work/tex'
im = Image.open(f'{TEX}/back300.png').convert('RGB')
x0, y0, x1, y1 = 1697, 2891, 2460, 3396           # the white barcode panel (measured on back300.png)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
d = ImageDraw.Draw(im)
random.seed(4)
mod = 4
L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
pat = '101' + ''.join(random.choice(L) for _ in range(6)) + '01010' + ''.join(random.choice(R) for _ in range(6)) + '101'
W, H = len(pat) * mod, 230
bx, by = cx - W // 2, cy - H // 2 - 10
for i, c in enumerate(pat):
    if c == '1':
        guard = i < 3 or i >= len(pat) - 3 or 45 <= i < 50
        d.rectangle([bx + i * mod, by, bx + (i + 1) * mod - 1, by + H + (22 if guard else 0)], fill=(20, 18, 24))
im.save(f'{TEX}/back300_bc.png')

# spine: rendered horizontally from tools/spine/spine.html, then turned to run top to bottom
subprocess.run(['node', '/home/claude/store/tools/shot.cjs', '/home/claude/store/tools/spine/spine.html', f'{TEX}/spine_h.png', '3371', '126', '1'], check=True)
Image.open(f'{TEX}/spine_h.png').rotate(-90, expand=True).save(f'{TEX}/spine_v.png')
print('textures ok')
