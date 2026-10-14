// Finds Playwright and Chromium on whatever machine this runs on (fresh sessions differ).
//   const { chromium, exe } = require('../pw.cjs');  chromium.launch({ ...exe, args: [...] })
const fs = require('fs');
const { execSync } = require('child_process');
const tries = ['playwright', '/home/claude/.npm-global/lib/node_modules/playwright'];
try { tries.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() + '/playwright'); } catch (e) {}
let pw = null;
for (const t of tries) { try { pw = require(t); break; } catch (e) {} }
if (!pw) throw new Error('Playwright not found: run `npm i -g playwright` (set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 if Chromium is preinstalled)');
const exePath = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));
module.exports = { chromium: pw.chromium, exe: exePath ? { executablePath: exePath } : {} };
