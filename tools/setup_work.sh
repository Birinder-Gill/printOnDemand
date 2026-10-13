#!/bin/sh
# Rebuild the working environment in a fresh session (empty machine). Run from anywhere:
#   sh /home/claude/store/tools/setup_work.sh [path/to/gift-backup.zip]
# Needs: this branch cloned at /home/claude/store; the book's gift backup zip (for re-rendering book images).
set -e
STORE=/home/claude/store
WORK=/home/claude/work
mkdir -p $WORK/pages $WORK/tex $WORK/r3d/final $WORK/preview $WORK/shots $WORK/look

# 1. preview harness + 3D tools
(cd $STORE/tools/preview && npm i --no-audit --no-fund >/dev/null 2>&1)
cp $STORE/tools/r3d/book.html $STORE/tools/r3d/render3d.cjs $STORE/tools/r3d/batch.sh $WORK/r3d/
(cd $WORK/r3d && [ -d node_modules/three ] || (npm init -y >/dev/null && npm i three@0.169.0 >/dev/null 2>&1))
ln -sfn $STORE/theme/assets $WORK/preview/assets
ln -sfn $STORE/media $WORK/preview/media
ln -sfn $WORK/look $WORK/preview/look

# 2. local servers: 8765 (3D renders, rooted at work), 8777 (theme preview)
(cd $WORK && nohup python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &)
(cd $WORK/preview && nohup python3 -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 &)

# 3. the book project (only needed to re-render book images)
ZIP="$1"
[ -z "$ZIP" ] && ZIP=$(ls -t /root/.claude/uploads/*/*gift-backup*.zip 2>/dev/null | head -1)
if [ -n "$ZIP" ] && [ ! -d /home/claude/gift ]; then
  mkdir -p /home/claude/gift_src && unzip -o -q "$ZIP" -d /home/claude/gift_src
  cp -r /home/claude/gift_src/gift /home/claude/gift
  cp /home/claude/gift_src/90s_crossword_*.json /home/claude/
  (cd /home/claude/gift && npm ci >/dev/null 2>&1)
  pip install uharfbuzz brotli --break-system-packages >/dev/null 2>&1 || true
fi
echo "setup done. Book images: sh $STORE/tools/render_book_images.sh"
