#!/usr/bin/env node
/**
 * Generates the wall-pattern tiles (SVG) for both panel etch designs
 * (Othello = dark etch lines, Grayline = gray etch lines) plus the plain
 * wall-colour swatches. PNG copies used inside notification e-mails
 * (most mail clients do not render SVG) are rendered with headless Chromium
 * via Playwright when it is available:  npm run build:patterns
 */
'use strict';

const fs = require('fs');
const path = require('path');
const catalog = require('../shared/catalog');

const W = 424;
const H = 320;
const OUT_PAT = path.join(__dirname, '..', 'public', 'images', 'patterns');
const OUT_OPT = path.join(__dirname, '..', 'public', 'images', 'options');
const ETCH = { othello: '#151515', grayline: '#9aa1ab' };

function lines(segments) {
  return segments.map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`).join('');
}

/** Running-bond (brick) layout – horizontal courses offset by `shift` of the brick width. */
function brick(bw, bh, shift = 0.5) {
  const seg = [];
  for (let y = 0, row = 0; y <= H; y += bh, row++) {
    seg.push([0, y, W, y]);
    const off = (row % 2) * bw * shift;
    for (let x = -bw + off; x <= W; x += bw) seg.push([x, y, x, y + bh]);
  }
  return lines(seg);
}

/** Vertical running bond (planks standing up). */
function vbrick(bw, bh, shift = 0.5) {
  const seg = [];
  for (let x = 0, col = 0; x <= W; x += bw, col++) {
    seg.push([x, 0, x, H]);
    const off = (col % 2) * bh * shift;
    for (let y = -bh + off; y <= H; y += bh) seg.push([x, y, x + bw, y]);
  }
  return lines(seg);
}

function grid(size) {
  const seg = [];
  for (let x = 0; x <= W; x += size) seg.push([x, 0, x, H]);
  for (let y = 0; y <= H; y += size) seg.push([0, y, W, y]);
  return lines(seg);
}

function hex(r) {
  const w = Math.sqrt(3) * r;
  let d = '';
  for (let row = -1, y = 0; y <= H + r * 2; row++, y = row * r * 1.5) {
    for (let col = -1; col * w <= W + w; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0);
      const cy = row * r * 1.5;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
      }
      d += `M${pts.join('L')}Z`;
    }
  }
  return d;
}

function chevron(colW, rise, gap) {
  let d = '';
  for (let x = 0; x <= W + colW; x += colW) {
    d += `M${x} 0L${x} ${H}`;
    for (let y = -rise; y <= H + rise; y += gap) {
      d += `M${x - colW} ${y + rise}L${x - colW / 2} ${y}L${x} ${y + rise}`;
    }
  }
  return d;
}

const PATTERNS = {
  'subway-3x6': () => brick(40, 20),
  'subway-4x12': () => brick(76, 26),
  'hexagonal-6': () => hex(32),
  'marazzi-12x12': () => grid(72),
  'fairfield-24x6': () => brick(96, 28, 1 / 3),
  chevron: () => chevron(64, 34, 32),
  'roman-block-12x24': () => brick(116, 52),
  'milano-6x24': () => vbrick(68, 190, 0.5),
  'smooth-seamless': () => ''
};

function patternSvg(id, etch) {
  const d = PATTERNS[id]();
  const bg = id === 'smooth-seamless' ? '#f7f6ef' : '#ffffff';
  const stroke = ETCH[etch];
  const sw = id === 'chevron' ? 3 : 2.4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
<rect width="${W}" height="${H}" fill="${bg}"/>
${d ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/>` : ''}
</svg>\n`;
}

function swatchSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${color}"/><rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>\n`;
}

/** Rasterise SVG -> PNG with headless Chromium (Playwright) for e-mail use. */
async function rasterise(jobs) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (_) {
    console.warn('Playwright not available - skipped PNG generation (SVGs written).');
    return 0;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const [svg, pngFile] of jobs) {
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: pngFile, clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();
  return jobs.length;
}

(async () => {
  fs.mkdirSync(OUT_PAT, { recursive: true });
  fs.mkdirSync(OUT_OPT, { recursive: true });
  const jobs = [];
  for (const id of Object.keys(PATTERNS)) {
    for (const etch of Object.keys(ETCH)) {
      const svg = patternSvg(id, etch);
      const file = path.join(OUT_PAT, `${id}-${etch}.svg`);
      fs.writeFileSync(file, svg);
      jobs.push([svg, file.replace(/\.svg$/, '.png')]);
    }
  }
  for (const o of catalog.findStep('wallColor').options.filter((x) => x.color)) {
    jobs.push([swatchSvg(o.color), path.join(OUT_OPT, `${o.id}.png`)]);
  }
  const png = await rasterise(jobs);
  console.log(`Wall patterns + swatches generated (${png} PNG files written).`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
