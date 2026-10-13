"""Checkpoint: commit and push the store branch, and write a backup zip to send to the user.
   python3 tools/backup.py "what changed"  -> /home/claude/90s-store-backup.zip
The zip holds the theme, tools and plan (no node_modules, no media: images live on the branch and can be
re-rendered with tools/render_book_images.sh + tools/media.py)."""
import os, subprocess, sys, zipfile

STORE = '/home/claude/store'
msg = sys.argv[1] if len(sys.argv) > 1 else 'Checkpoint'
os.chdir(STORE)
subprocess.run(['git', 'add', '-A'], check=True)
r = subprocess.run(['git', 'diff', '--cached', '--quiet'])
if r.returncode:
    body = f'{msg}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01N9nUzWnX6CttP1Wf7BU5M8'
    subprocess.run(['git', 'commit', '-q', '-m', body], check=True)
p = subprocess.run(['git', 'push', '-q', 'origin', 'crossword-store'], capture_output=True, text=True)
print('push:', 'ok' if p.returncode == 0 else p.stderr[-400:])
sha = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()

out = '/home/claude/90s-store-backup.zip'
n = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(STORE):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'media', 'dist', '__pycache__')]
        for fn in files:
            if fn == '.git':
                continue
            full = os.path.join(root, fn)
            z.write(full, os.path.join('store', os.path.relpath(full, STORE)))
            n += 1
    z.writestr('store/CHECKPOINT.txt', f'branch crossword-store @ {sha}\n{msg}\n')
print(out, n, 'files,', round(os.path.getsize(out) / 1024 / 1024, 2), 'MB, commit', sha[:10])
