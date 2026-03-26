/**
 * GCC/UAE DATA FETCHER
 * Fetches employment data for GCC programmes from ILO ILOSTAT API.
 * No authentication required. Weighted average across UAE (ARE), Saudi Arabia (SAU), Qatar (QAT).
 * USAGE: node fetchers/gcc.js [--dry-run]
 */

import { writeFileSync, mkdirSync } from 'fs';
import { SOC_MAP } from '../soc-map.js';

const DRY_RUN = process.argv.includes('--dry-run');
mkdirSync('./cache', { recursive: true });
mkdirSync('./output', { recursive: true });

const ILO_BASE = 'https://ilostat.ilo.org/resources/ilostat-api/v1';
const COUNTRIES = [
  { code: 'ARE', name: 'UAE',   weight: 0.45 },
  { code: 'SAU', name: 'Saudi', weight: 0.35 },
  { code: 'QAT', name: 'Qatar', weight: 0.20 },
];

// UAE Vision 2031 / KSA Vision 2030 sector employment signals
const VISION_OVERRIDES = {
  'gcc-cs':                { mult: 1.31, src: 'UAE AI Strategy 2031' },
  'gcc-data-analytics':    { mult: 1.26, src: 'UAE AI Strategy 2031 / KSA Smart City' },
  'gcc-logistics':         { mult: 1.28, src: 'UAE Logistics Strategy 2030' },
  'gcc-engineering-civil': { mult: 1.24, src: 'KSA NEOM + Giga-projects 2030' },
  'gcc-hospitality':       { mult: 1.18, src: 'UAE Tourism Strategy 2031' },
  'gcc-architecture':      { mult: 1.16, src: 'KSA NEOM / Red Sea / Diriyah' },
  'gcc-nursing':           { mult: 1.08, src: 'UAE/KSA healthcare nationalisation 2030' },
  'gcc-medicine':          { mult: 1.11, src: 'UAE National Health Strategy 2023-2031' },
  'gcc-petroleum-eng':     { mult: 0.94, src: 'Energy transition / UAE Net Zero 2050' },
  'gcc-arabic-media':      { mult: 0.76, src: 'Media consolidation; Arabic LLM substitution' },
  'gcc-islamic-finance':   { mult: 1.08, src: 'KSA Islamic finance expansion' },
  'gcc-business-admin':    { mult: 0.88, src: 'GCC business graduate market saturation' },
};

const FALLBACKS = {
  'gcc-business-admin':0.04,'gcc-engineering-civil':0.22,'gcc-islamic-finance':0.11,
  'gcc-cs':0.28,'gcc-petroleum-eng':0.06,'gcc-hospitality':0.19,'gcc-medicine':0.24,
  'gcc-arabic-media':-0.08,'gcc-logistics':0.17,'gcc-architecture':0.21,
  'gcc-data-analytics':0.31,'gcc-nursing':0.29,
};

async function fetchILO(iscoCode) {
  const major = iscoCode[0];
  let weightedTrend = 0, totalWeight = 0;
  for (const c of COUNTRIES) {
    const url = ILO_BASE + '/data/EMP_TEMP_SEX_OCU_NB_A/' + c.code + '/SEX_T+OCU_ISCO08_' + major;
    if (DRY_RUN) { console.log('  [DRY RUN] Would fetch: ' + url); continue; }
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) continue;
      const d = await r.json();
      const obs = d?.dataSets?.[0]?.observations;
      if (!obs) continue;
      const vals = Object.values(obs).map(v => v[0]).filter(v => v !== null);
      if (vals.length < 2) continue;
      const recent = vals.slice(-4);
      const trend = (recent[recent.length-1] - recent[0]) / recent[0];
      weightedTrend += trend * c.weight;
      totalWeight += c.weight;
      console.log('  ILO ' + c.code + ': ' + (trend*100).toFixed(1) + '%');
    } catch(e) { console.log('  ILO ' + c.code + ' failed: ' + e.message); }
  }
  return totalWeight > 0 ? weightedTrend / totalWeight : null;
}

const PROGRAMMES = [
  { id:'gcc-business-admin', name:'Business Administration (BBA)', field:'Business', code:'ISCED-0413', halfLifeBase:2.3, facultyReady:19, region:0.88, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[3.1,2.4,1.8], enrolNote:'Slowing growth — market saturation approaching. UAE MOHESR 2022-2024.', tasks:[{name:'Prepare management reports',type:'rep',score:0.88},{name:'Analyse business data',type:'rep',score:0.82},{name:'Lead strategy sessions',type:'aug',score:0.29},{name:'Manage stakeholder relationships',type:'aug',score:0.18},{name:'Draft business proposals',type:'rep',score:0.85}]},
  { id:'gcc-engineering-civil', name:'Civil & Infrastructure Engineering', field:'Engineering', code:'ISCED-0732', halfLifeBase:6.8, facultyReady:31, region:1.24, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[8.4,11.2,13.1], enrolNote:'High growth — UAE/KSA megaproject pipeline. UAE MOHESR 2022-2024.', tasks:[{name:'Structural design calculations',type:'rep',score:0.71},{name:'BIM modelling',type:'rep',score:0.75},{name:'Site inspection',type:'aug',score:0.08},{name:'Project cost estimation',type:'rep',score:0.68},{name:'Regulatory compliance',type:'aug',score:0.37}]},
  { id:'gcc-islamic-finance', name:'Islamic Finance & Banking', field:'Business', code:'ISCED-0412', halfLifeBase:3.4, facultyReady:16, region:1.08, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[4.2,5.1,6.8], enrolNote:'Growing — strong regional employer pull. UAE MOHESR 2022-2024.', tasks:[{name:'Shariah compliance review',type:'aug',score:0.42},{name:'Prepare Islamic instruments',type:'rep',score:0.79},{name:'Client advisory on halal investing',type:'aug',score:0.31},{name:'AAOIFI regulatory reporting',type:'rep',score:0.81},{name:'Sukuk structuring',type:'rep',score:0.73}]},
  { id:'gcc-cs', name:'Computer Science & AI', field:'Technology', code:'ISCED-0613', halfLifeBase:3.1, facultyReady:41, region:1.31, estimatedDims:['facultyReady','region'], enrolTrend:[24.1,29.4,31.2], enrolNote:'Explosive growth — UAE AI Strategy 2031. UAE MOHESR 2022-2024.', tasks:[{name:'Develop software applications',type:'rep',score:0.76},{name:'Build ML models',type:'aug',score:0.52},{name:'System architecture design',type:'aug',score:0.38},{name:'Cybersecurity implementation',type:'aug',score:0.34},{name:'Code review',type:'rep',score:0.71}]},
  { id:'gcc-petroleum-eng', name:'Petroleum Engineering', field:'Engineering', code:'ISCED-0715', halfLifeBase:6.2, facultyReady:34, region:1.42, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[-2.4,-4.1,-5.8], enrolNote:'Declining — energy transition dampening applications despite employer demand. UAE MOHESR 2022-2024.', tasks:[{name:'Reservoir simulation',type:'rep',score:0.74},{name:'Well planning & drilling',type:'rep',score:0.66},{name:'On-site operations',type:'aug',score:0.12},{name:'Environmental impact assessment',type:'rep',score:0.69},{name:'Project management',type:'aug',score:0.33}]},
  { id:'gcc-hospitality', name:'Hospitality & Tourism Management', field:'Business', code:'ISCED-1015', halfLifeBase:4.6, facultyReady:14, region:1.18, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[6.8,9.2,11.4], enrolNote:'Strong growth — UAE Tourism Strategy 2031, 40M visitors target. UAE MOHESR 2022-2024.', tasks:[{name:'Manage reservations',type:'rep',score:0.84},{name:'Revenue optimisation',type:'rep',score:0.81},{name:'Guest experience management',type:'aug',score:0.12},{name:'Event planning',type:'aug',score:0.31},{name:'Staff training',type:'aug',score:0.22}]},
  { id:'gcc-medicine', name:'Medicine (MBBS / MD)', field:'Health', code:'ISCED-0912', halfLifeBase:8.4, facultyReady:29, region:1.11, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[4.1,4.8,5.2], enrolNote:'Steady growth — UAE/KSA healthcare nationalisation targets. UAE MOHESR 2022-2024.', tasks:[{name:'Diagnose from imaging',type:'aug',score:0.54},{name:'Patient clinical examination',type:'aug',score:0.09},{name:'Medical record documentation',type:'rep',score:0.74},{name:'Treatment planning',type:'aug',score:0.28},{name:'Surgical procedures',type:'aug',score:0.04}]},
  { id:'gcc-arabic-media', name:'Arabic Media & Communications', field:'Arts & Humanities', code:'ISCED-0321', halfLifeBase:2.6, facultyReady:12, region:0.76, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[-3.8,-5.2,-6.4], enrolNote:'Declining — Arabic LLM capability accelerating faster than English equivalents. UAE MOHESR 2022-2024.', tasks:[{name:'Write Arabic news content',type:'rep',score:0.88},{name:'Translate & localise content',type:'rep',score:0.91},{name:'Social media management',type:'rep',score:0.86},{name:'Investigate stories',type:'aug',score:0.24},{name:'On-screen presentation',type:'aug',score:0.17}]},
  { id:'gcc-logistics', name:'Logistics & Supply Chain', field:'Business', code:'ISCED-0414', halfLifeBase:3.8, facultyReady:18, region:1.28, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[9.4,12.1,14.8], enrolNote:'Strong growth — Dubai Logistics Strategy, Jebel Ali expansion. UAE MOHESR 2022-2024.', tasks:[{name:'Demand forecasting',type:'rep',score:0.83},{name:'Route optimisation',type:'rep',score:0.87},{name:'Supplier negotiation',type:'aug',score:0.34},{name:'Inventory management',type:'rep',score:0.79},{name:'Cross-border compliance',type:'aug',score:0.44}]},
  { id:'gcc-architecture', name:'Architecture & Urban Design', field:'Design', code:'ISCED-0731', halfLifeBase:4.4, facultyReady:28, region:1.16, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[7.2,8.4,9.8], enrolNote:'Strong growth — GCC smart city and construction boom. UAE MOHESR 2022-2024.', tasks:[{name:'Parametric design',type:'rep',score:0.74},{name:'Technical documentation',type:'rep',score:0.78},{name:'Client brief development',type:'aug',score:0.29},{name:'Planning navigation',type:'aug',score:0.34},{name:'Construction oversight',type:'aug',score:0.11}]},
  { id:'gcc-data-analytics', name:'Data Science & Analytics', field:'Technology', code:'ISCED-0612', halfLifeBase:3.4, facultyReady:38, region:1.26, estimatedDims:['facultyReady','region'], enrolTrend:[19.2,24.4,28.1], enrolNote:'Explosive growth — UAE national AI strategy and Smart Dubai. UAE MOHESR 2022-2024.', tasks:[{name:'Data cleaning & transformation',type:'rep',score:0.84},{name:'Build dashboards',type:'rep',score:0.78},{name:'Statistical modelling',type:'aug',score:0.52},{name:'Present insights',type:'aug',score:0.31},{name:'Write analytical reports',type:'rep',score:0.81}]},
  { id:'gcc-nursing', name:'Nursing (BSc)', field:'Health', code:'ISCED-0913', halfLifeBase:9.1, facultyReady:22, region:1.08, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[8.1,9.4,10.2], enrolNote:'Strong growth — Saudisation/Emiratisation healthcare targets. UAE MOHESR 2022-2024.', tasks:[{name:'Patient monitoring',type:'aug',score:0.14},{name:'Clinical documentation',type:'rep',score:0.68},{name:'Medication administration',type:'aug',score:0.08},{name:'Patient education',type:'aug',score:0.11},{name:'Coordinate care',type:'aug',score:0.24}]},
];

async function build() {
  console.log('\n=== Canary GCC Data Fetcher ===');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN' : 'LIVE'));
  const results = [];
  for (const prog of PROGRAMMES) {
    const soc = SOC_MAP[prog.id];
    const fb = FALLBACKS[prog.id];
    const vision = VISION_OVERRIDES[prog.id];
    console.log('\nProcessing: ' + prog.name);
    let empOut = fb;
    if (soc?.isco08?.[0]) {
      const trend = await fetchILO(soc.isco08[0]);
      if (trend !== null) {
        const raw = trend * 2.0 * 0.8;
        const visionAdj = vision ? raw * 0.6 + (vision.mult - 1.0) * 0.5 * 0.4 : raw;
        empOut = parseFloat(Math.max(-0.30, Math.min(0.35, visionAdj)).toFixed(3));
        console.log('  ILO empOut: ' + empOut + (vision ? ' (+ ' + vision.src + ')' : ''));
      } else {
        if (vision) { empOut = parseFloat(Math.max(-0.30, Math.min(0.35, fb * 0.6 + (vision.mult-1.0)*0.5*0.4)).toFixed(3)); }
        console.log('  Fallback empOut: ' + empOut);
      }
    }
    const exposure = soc?.exposureFinal || 0.60;
    const halfLife = parseFloat((prog.halfLifeBase * (1 + (exposure - 0.5) * -0.3)).toFixed(1));
    results.push({ ...prog, exposure, halfLife, empOut, mechanism: soc?.mechanism || 'aug', _meta: { eloundouBeta: soc?.eloundouBeta, isco08: soc?.isco08, approximated: soc?.approx ?? true, fetchedAt: new Date().toISOString(), dataQualityNote: 'GCC: ISCO-08 at 1-digit level only. All regional multipliers estimated.' } });
  }
  if (!DRY_RUN) writeFileSync('./output/programs-gcc.js', 'export const DATA_GCC = ' + JSON.stringify(results, null, 2) + ';');
  console.log('\nGCC build complete: ' + results.length + ' programmes');
}

build().catch(console.error);
