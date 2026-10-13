import fs from 'node:fs';
import path from 'node:path';
export const MEDIA = '/home/claude/store/media';
const imgDims = {};
export function imageSize(file) {
  if (imgDims[file]) return imgDims[file];
  try {
    const b = fs.readFileSync(file);
    let w = 0, h = 0;
    if (b[0] === 0x89 && b[1] === 0x50) { w = b.readUInt32BE(16); h = b.readUInt32BE(20); }
    else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; }
        i += 2 + len;
      }
    } else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const fmt = b.toString('ascii', 12, 16);
      if (fmt === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
      else if (fmt === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
      else if (fmt === 'VP8L') { const n = b.readUInt32LE(21); w = (n & 0x3fff) + 1; h = ((n >> 14) & 0x3fff) + 1; }
    }
    imgDims[file] = { w, h };
  } catch (e) { imgDims[file] = { w: 1000, h: 1000 }; }
  return imgDims[file];
}
export function imageObj(ref, alt = '') {
  if (!ref) return null;
  if (typeof ref === 'object') return ref;
  let file;
  if (ref.startsWith('shopify://shop_images/')) file = `${MEDIA}/files/${ref.slice(22)}`;
  else if (ref.startsWith('/media/')) file = `${MEDIA}/${ref.slice(7)}`;
  else file = ref;
  const { w, h } = imageSize(file);
  const src = '/media/' + path.relative(MEDIA, file);
  return { src, url: src, width: w, height: h, aspect_ratio: w / (h || 1), alt, id: Math.abs(hash(src)), media_type: 'image', __img: true,
    preview_image: null, toString() { return src; } };
}
export function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
