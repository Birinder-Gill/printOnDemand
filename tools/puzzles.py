"""Puzzle card data (one record per puzzle) for the "puzzle" metaobjects and the local preview.
   python3 tools/puzzles.py  -> tools/puzzles.json"""
import json

D = json.load(open('/home/claude/90s_crossword_puzzles.json'))
CAT = {  # book's own short names (back cover)
    'Pop Stars & Divas': 'Pop Stars', 'Grunge, Rock & Alternative': 'Rock & Alternative'}
SECTION = {'TV': 'Television', 'Movies': 'Movies', 'Music': 'Music', 'Games & Toys': 'Games & Toys',
           'Everyday Life': 'Everyday Life', 'Sports, News & Slang': 'Sports, News & Slang'}
NOTES = {
 1: "A coffeehouse chalkboard menu in chalk, with the puzzle number on a mug.",
 2: "A TV listings digest page with the prime-time grid.",
 3: "A classified case file: manila folder, typewriter text and rubber stamps.",
 4: "A teen-drama end card at dusk over the lake, with credits-style clues.",
 5: "The back of a cereal box, with a bowl of loops and a nutrition-facts panel.",
 6: "Comic-book pop art: Ben-Day dots, panels and sound effects.",
 7: "A game show stage with marquee bulbs, a big board and LED podiums.",
 8: "TV color bars and a VCR on-screen display.",
 9: "A striped popcorn box, a heap of kernels and a ticket strip.",
 10: "A cinema marquee at night and an action poster with its billing block.",
 11: "A comedy club: brick wall, neon sign, spotlight and mic.",
 12: "A rom-com poster: white with red type, tumbling letters and a heart balloon.",
 13: "A white clamshell tape case with a gold title and a rental sticker.",
 14: "An illuminated storybook page with a vine border and a gilded initial.",
 15: "Art deco premiere night: gold on black, a fan and searchlights.",
 16: "A glossy magazine cover with masthead, cover lines and a barcode.",
 17: "A green-bar tractor-feed chart printout with a dot-matrix banner.",
 18: "A CD jewel case: the disc with its sheen and the tray card.",
 19: "A pull-out poster taped to lilac wallpaper, with stickers.",
 20: "A ticket stub, a stage screen under the truss and a laminate.",
 21: "A photocopied zine: ransom letters, torn paper and label-maker strips.",
 22: "A split-fountain gig poster with a halftone sun and pines.",
 23: "A car stereo head unit with an amber display and big speakers.",
 24: "An aubergine satin record sleeve with gold script.",
 25: "A letterpress wood-type show poster in red and black on cream.",
 26: "The seat of a pair of jeans: a leather patch title and a red bandana grid.",
 27: "A karaoke screen with a blue gradient, a bouncing ball and lyric bars.",
 28: "A light-up dance floor: the grid's empty squares are the tiles.",
 29: "A 16-bit game title screen with pixel art and a HUD.",
 30: "An arcade fighter versus screen with health bars and scanlines.",
 31: "A holiday toy catalog page circled in red crayon, with a note to Santa.",
 32: "A toy on a blister card on a pegboard, the grid under the clear bubble.",
 33: "A 90s desktop with yellow title tabs and a connection-lost alert.",
 34: "A homemade web page: starfield, rainbow headline and a visitor counter.",
 35: "A school photo order envelope with a laser-backdrop proof print.",
 36: "Swing tags and a woven label on a loud teal Memphis print.",
 37: "A turquoise cafeteria tray on a wood table, compartments as the layout.",
 38: "A drive-thru menu board at dusk, a speaker post and a teal minivan.",
 39: "A mall directory map: the grid is the food court, You Are Here.",
 40: "Black-light arcade carpet with a movie ticket, a game card and tokens.",
 41: "A marbled composition book, a ruled sheet and index-card clues.",
 42: "A cork bulletin board with a scalloped border and paper letters.",
 43: "The back of a trading card in two inks, with a rookie stat line.",
 44: "A crimson felt banner on a gym wall, with tassels and fringe.",
 45: "A broadsheet front page on aged newsprint, the grid as the lead photo.",
 46: "1992 newscast graphics: a wireframe globe, chrome title and a ticker.",
 47: "Loud brutalism on acid yellow-green, with a slang tape.",
 48: "A late-night mail-order ad end card with a call-now bar.",
}
out = []
for p in D['puzzles']:
    i = p['id']
    page = i + (7 if i <= 8 else 9 if i <= 16 else 11 if i <= 28 else 13 if i <= 32 else 15 if i <= 42 else 17)
    ents = p['across'] + p['down']
    out.append({'number': i, 'handle': f'puzzle-{i:02d}', 'title': p['title'], 'category': CAT.get(p['category'], p['category']),
                'section': SECTION[p['group']], 'side': 'A' if i % 2 else 'B', 'clues': len(ents),
                'hints': sum(1 for e in ents if e.get('hint')), 'page': page, 'note': NOTES[i], 'image': f'nac-pz-{i:02d}.jpg'})
json.dump(out, open('/home/claude/store/tools/puzzles.json', 'w'), indent=1)
print(len(out), sum(x['clues'] for x in out), sum(x['hints'] for x in out))
