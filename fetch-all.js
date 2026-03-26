/**
 * CANARY — MASTER DATA FETCHER
 * Orchestrates all regional data fetchers and writes the final merged data file.
 *
 * USAGE:
 *   node fetch-all.js              — fetch all regions live
 *   node fetch-all.js --dry-run    — show what would be fetched
 *   node fetch-all.js --uk-only    — fetch UK only
 *   node fetch-all.js --gcc-only   — fetch GCC only
 *
 * OUTPUT FILES:
 *   output/programs-uk.js          — UK programme data (ONS ASHE + ILO ILOSTAT)
 *   output/programs-gcc.js         — GCC programme data (ILO ILOSTAT)
 *   output/canary-data.js          — Merged file for direct use in app
 *   output/fetch-report.json       — Build audit log with source citations
 *
 * REBUILD TRIGGERS:
 *   - ONS ASHE annual tables (usually November)
 *   - ILO ILOSTAT annual update (usually Q1)
 *   - HESA Student Record publication (usually January)
 *   - New Eloundou / Felten AI exposure research published
 *
 * Requires Node.js 18+ — native fetch built in, no npm packages needed.
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const DRY_RUN  = process.argv.includes('--dry-run');
const UK_ONLY  = process.argv.includes('--uk-only');
const GCC_ONLY = process.argv.includes('--gcc-only');

mkdirSync('./output', { recursive: true });
mkdirSync('./cache',  { recursive: true });

const startTime = Date.now();

console.log('\n=== CANARY — DATA FETCH BUILD ===');
console.log('Sources: ONS ASHE | ILO ILOSTAT | Eloundou et al. | Felten | HESA');
console.log('Mode: ' + (DRY_RUN ? 'DRY RUN' : 'LIVE FETCH'));
console.log('Time: ' + new Date().toISOString() + '\n');

function runFetcher(name, script) {
  console.log('Running ' + name + ' fetcher...');
  try {
    const flags = DRY_RUN ? ' --dry-run' : '';
    execSync('node fetchers/' + script + flags, { stdio: 'inherit' });
    console.log(name + ' fetcher complete');
    return true;
  } catch (err) {
    console.error(name + ' fetcher failed: ' + err.message);
    return false;
  }
}

const results = { uk: false, gcc: false };
if (!GCC_ONLY) results.uk  = runFetcher('UK',      'uk.js');
if (!UK_ONLY)  results.gcc = runFetcher('GCC/UAE',  'gcc.js');

// Merge outputs
const ukPath  = './output/programs-uk.js';
const gccPath = './output/programs-gcc.js';
let ukData = '[]', gccData = '[]';

if (existsSync(ukPath)) {
  const raw = readFileSync(ukPath, 'utf8');
  const m = raw.match(/export const DATA_UK = ([\s\S]*?);\s*$/m);
  if (m) ukData = m[1];
}
if (existsSync(gccPath)) {
  const raw = readFileSync(gccPath, 'utf8');
  const m = raw.match(/export const DATA_GCC = ([\s\S]*?);\s*$/m);
  if (m) gccData = m[1];
}

const merged = `// CANARY — MERGED DATA FILE
// Generated: ${new Date().toISOString()}
// Sources: ONS ASHE | ILO ILOSTAT | Eloundou et al. (2023) | Felten et al. (2023) | HESA | BLS
// After generating, copy DATA_UK and DATA_GCC into index.html script block

const DATA_UK = ${ukData};
const DATA_GCC = ${gccData};
const DATA_US = []; // Regenerate with: node fetchers/us.js
const REGION_DATA = { uk: DATA_UK, gcc: DATA_GCC, us: DATA_US };
`;

if (!DRY_RUN) {
  writeFileSync('./output/canary-data.js', merged);
  console.log('Written: output/canary-data.js');
  writeFileSync('./output/fetch-report.json', JSON.stringify({
    buildTime: new Date().toISOString(),
    duration: ((Date.now() - startTime)/1000).toFixed(1) + 's',
    mode: DRY_RUN ? 'dry-run' : 'live',
    fetchers: results,
    sources: {
      aiExposure: 'Eloundou et al. (2023) arXiv:2303.10130 + Felten Princeton Index (0.6/0.4 blend)',
      ukEmployment: 'ILO ILOSTAT EMP_TEMP_SEX_OCU_NB_A (GBR) | fallback: Working Futures 2017-2027',
      ukPay: 'ONS ASHE api.ons.gov.uk | fallback: ONS ASHE 2024 published table',
      ukEnrolment: 'HESA Student Record 2021-2024, CAH subject codes',
      ukFaculty: 'Jisc Digital Experience Insights 2023/24 Staff Survey (estimated)',
      gccEmployment: 'ILO ILOSTAT (ARE/SAU/QAT weighted) | UAE Vision 2031 | KSA Vision 2030',
    }
  }, null, 2));
}

const elapsed = ((Date.now() - startTime)/1000).toFixed(1);
console.log('\nBuild complete in ' + elapsed + 's');
console.log('UK: ' + (results.uk ? 'OK' : 'FAIL') + '  GCC: ' + (results.gcc ? 'OK' : 'FAIL'));
console.log('\nNext: copy output/canary-data.js values into index.html, then push.');
