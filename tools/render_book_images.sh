#!/bin/sh
# Re-render the book images the store uses (only needed if media/ must be rebuilt). About 10 minutes.
set -e
WORK=/home/claude/work
cd /home/claude/gift
python3 covers.py front back --dpi 100
python3 build.py book --dpi 100
cd $WORK/pages && pdftoppm -r 200 -png /home/claude/gift/out/book.pdf p
cd $WORK && pdftoppm -r 300 -png -singlefile /home/claude/gift/out/cover-front.pdf tex/front300 && pdftoppm -r 300 -png -singlefile /home/claude/gift/out/cover-back.pdf tex/back300
python3 /home/claude/store/tools/textures.py
cd $WORK/r3d && sh batch.sh
echo "now: python3 /home/claude/store/tools/media.py"
