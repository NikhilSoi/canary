/**
 * CANARY — DATA INJECTION SCRIPT
 * Reads freshly fetched data from output/ and patches it into index.html.
 * Called automatically by the GitHub Actions auto-update workflow.
 * Run manually: node scripts/inject-data.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const indexPath = './index.html';
const ukPath    = './output/programs-uk.js';
const gccPath   = './output/programs-gcc.js';

if (!existsSync(ukPath) || !existsSync(gccPath)) {
  console.error('Output files not found. Run node fetch-all.js first.');
  process.exit(1);
}

let html = readFileSync(indexPath, 'utf8');

// Extract UK data
const ukRaw = readFileSync(ukPath, 'utf8');
const ukMatch = ukRaw.match(/export const DATA_UK = ([\s\S]+?);\s*$/m);
if (!ukMatch) { console.error('Could not parse DATA_UK from output'); process.exit(1); }

// Extract GCC data
const gccRaw = readFileSync(gccPath, 'utf8');
const gccMatch = gccRaw.match(/export const DATA_GCC = ([\s\S]+?);\s*$/m);
if (!gccMatch) { console.error('Could not parse DATA_GCC from output'); process.exit(1); }

// Replace DATA_UK in index.html
html = html.replace(
  /const DATA_UK=\[\s*[\s\S]*?\];/,
  'const DATA_UK=' + ukMatch[1].replace(/\s+/g,' ') + ';'
);

// Replace DATA_GCC in index.html  
html = html.replace(
  /const DATA_GCC=\[\s*[\s\S]*?\];/,
  'const DATA_GCC=' + gccMatch[1].replace(/\s+/g,' ') + ';'
);

// Inject build timestamp into a meta tag
const buildTime = new Date().toISOString();
html = html.replace(
  /data-build-time="[^"]*"/,
  `data-build-time="${buildTime}"`
);

writeFileSync(indexPath, html);
console.log('✓ index.html updated with fresh data at', buildTime);
console.log('  DATA_UK:', ukMatch[1].length, 'chars');
console.log('  DATA_GCC:', gccMatch[1].length, 'chars');
