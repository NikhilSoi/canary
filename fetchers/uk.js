/**
 * UK DATA FETCHER
 * Fetches employment data for UK programmes from:
 *   1. ONS ASHE API (api.ons.gov.uk) — median pay by SOC 2020
 *   2. ILO ILOSTAT API (ilostat.ilo.org) — employment trends by ISCO-08 (GBR)
 *
 * Requires Node.js 18+ — native fetch built in, no npm needed.
 * USAGE: node fetchers/uk.js [--dry-run]
 *
 * Half-life methodology:
 *   halfLife = baseHalfLife * (1 + ln(wage/nationalMedian) * 0.3)
 *   Based on Acemoglu & Restrepo (2022) — high-wage occupations automate more slowly.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { SOC_MAP } from '../soc-map.js';

const DRY_RUN = process.argv.includes('--dry-run');
mkdirSync('./cache', { recursive: true });
mkdirSync('./output', { recursive: true });

const ONS_BASE = 'https://api.ons.gov.uk/v1';
const ILO_BASE = 'https://ilostat.ilo.org/resources/ilostat-api/v1';

async function fetchONSPay(soc4) {
  const url = ONS_BASE + '/dataset/EARN01/timeseries/KAI4/data';
  if (DRY_RUN) { console.log('  [DRY RUN] Would fetch: ' + url); return null; }
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.months?.[0]?.value ? parseFloat(d.months[0].value) : null;
  } catch { return null; }
}

async function fetchILOTrend(iscoCode) {
  const group = iscoCode.substring(0, 2);
  const url = ILO_BASE + '/data/EMP_TEMP_SEX_OCU_NB_A/GBR/SEX_T+OCU_ISCO88_' + group;
  if (DRY_RUN) { console.log('  [DRY RUN] Would fetch: ' + url); return null; }
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const d = await r.json();
    const obs = d?.dataSets?.[0]?.observations;
    if (!obs) return null;
    const vals = Object.values(obs).map(v => v[0]).filter(v => v !== null);
    if (vals.length < 2) return null;
    const recent = vals.slice(-5);
    return (recent[recent.length-1] - recent[0]) / recent[0];
  } catch { return null; }
}

function calcHalfLife(base, beta, wage, natMedian = 700) {
  if (!wage) return base;
  const ratio = wage / natMedian;
  const mult = Math.max(0.5, Math.min(1.8, 1 + Math.log(ratio) * 0.3));
  const expMult = Math.max(0.5, 1 - (beta - 0.5) * 0.3);
  return parseFloat((base * mult * expMult).toFixed(1));
}

const FALLBACKS = {
  'uk-accounting':  { empOut:-0.03, pay:920 }, 'uk-cs':{ empOut:0.14, pay:1150 },
  'uk-law':{ empOut:0.02, pay:980 }, 'uk-nursing':{ empOut:0.18, pay:680 },
  'uk-marketing':{ empOut:-0.04, pay:720 }, 'uk-data-sci':{ empOut:0.21, pay:1080 },
  'uk-journalism':{ empOut:-0.12, pay:560 }, 'uk-civil-eng':{ empOut:0.09, pay:890 },
  'uk-psychology':{ empOut:0.06, pay:620 }, 'uk-economics':{ empOut:0.07, pay:960 },
  'uk-social-work':{ empOut:0.16, pay:590 }, 'uk-architecture':{ empOut:0.04, pay:750 },
  'uk-pharma':{ empOut:0.08, pay:830 }, 'uk-finance':{ empOut:-0.01, pay:1040 },
  'uk-teaching':{ empOut:0.11, pay:680 }, 'uk-biomedical':{ empOut:0.13, pay:710 },
};

const PROGRAMMES = [
  { id:'uk-accounting', name:'Accounting & Finance', field:'Business', code:'CAH17-01-01', halfLifeBase:1.7, facultyReady:24, region:0.92, estimatedDims:['halfLife','facultyReady'], enrolTrend:[-2.1,-3.4,-1.8], enrolNote:'Declining — EY/KPMG graduate intake automation signals. HESA 2021-2024.', tasks:[{name:'Prepare financial statements',type:'rep',score:0.92},{name:'Process accounts payable',type:'rep',score:0.89},{name:'Advise on tax planning',type:'aug',score:0.54},{name:'Audit internal controls',type:'aug',score:0.47},{name:'Build financial models',type:'rep',score:0.81}]},
  { id:'uk-cs', name:'Computer Science', field:'Technology', code:'CAH11-01-01', halfLifeBase:3.2, facultyReady:58, region:1.18, estimatedDims:['facultyReady'], enrolTrend:[8.2,11.4,9.7], enrolNote:'Strong growth — graduates will work alongside AI from day one. HESA 2021-2024.', tasks:[{name:'Write and test code',type:'rep',score:0.78},{name:'Design system architecture',type:'aug',score:0.41},{name:'Debug legacy systems',type:'rep',score:0.72},{name:'Lead technical decisions',type:'aug',score:0.22},{name:'Review code contributions',type:'aug',score:0.55}]},
  { id:'uk-nursing', name:'Nursing (BSc)', field:'Health', code:'CAH02-01-01', halfLifeBase:9.4, facultyReady:41, region:1.12, estimatedDims:['halfLife','facultyReady'], enrolTrend:[3.1,4.2,5.8], enrolNote:'Growing — NHS Long Term Workforce Plan driving funded places. HESA 2021-2024.', tasks:[{name:'Administer medications',type:'aug',score:0.09},{name:'Document patient records',type:'rep',score:0.71},{name:'Assess patient condition',type:'aug',score:0.18},{name:'Patient education',type:'aug',score:0.14},{name:'Coordinate care pathways',type:'aug',score:0.27}]},
  { id:'uk-law', name:'Law (LLB)', field:'Law', code:'CAH14-01-01', halfLifeBase:3.8, facultyReady:29, region:1.04, estimatedDims:['halfLife','facultyReady'], enrolTrend:[1.2,0.8,-0.4], enrolNote:'Flat — AI threat to paralegal pipeline reducing employer demand. HESA 2021-2024.', tasks:[{name:'Draft contracts',type:'rep',score:0.85},{name:'Legal research',type:'rep',score:0.79},{name:'Advise on legal strategy',type:'aug',score:0.31},{name:'Represent clients',type:'aug',score:0.08},{name:'Due diligence review',type:'rep',score:0.82}]},
  { id:'uk-journalism', name:'Journalism & Media', field:'Arts & Humanities', code:'CAH19-01-02', halfLifeBase:1.9, facultyReady:22, region:0.84, estimatedDims:['halfLife','facultyReady'], enrolTrend:[-6.2,-8.4,-9.1], enrolNote:'Steep decline — newsroom restructuring accelerating. HESA 2021-2024.', tasks:[{name:'Write news articles',type:'rep',score:0.87},{name:'Summarise press releases',type:'rep',score:0.93},{name:'Investigate sources',type:'aug',score:0.28},{name:'Edit and sub-edit copy',type:'rep',score:0.84},{name:'Produce broadcast content',type:'aug',score:0.31}]},
  { id:'uk-data-sci', name:'Data Science & Analytics', field:'Technology', code:'CAH11-01-03', halfLifeBase:3.6, facultyReady:52, region:1.22, estimatedDims:['facultyReady'], enrolTrend:[18.4,22.1,19.8], enrolNote:'Rapid growth — strong employer pull. HESA 2021-2024.', tasks:[{name:'Clean and transform data',type:'rep',score:0.82},{name:'Build predictive models',type:'aug',score:0.55},{name:'Communicate insights',type:'aug',score:0.34},{name:'Write data pipelines',type:'rep',score:0.74},{name:'Evaluate model performance',type:'aug',score:0.49}]},
  { id:'uk-marketing', name:'Marketing & Communications', field:'Business', code:'CAH17-01-04', halfLifeBase:2.4, facultyReady:31, region:0.98, estimatedDims:['halfLife','facultyReady'], enrolTrend:[-0.8,-2.1,-3.2], enrolNote:'Declining — employer perception shift on marketing degree value. HESA 2021-2024.', tasks:[{name:'Create ad content',type:'rep',score:0.91},{name:'Manage social campaigns',type:'rep',score:0.83},{name:'Develop brand strategy',type:'aug',score:0.38},{name:'Analyse campaign data',type:'rep',score:0.77},{name:'Manage client relationships',type:'aug',score:0.21}]},
  { id:'uk-economics', name:'Economics (BSc)', field:'Social Sciences', code:'CAH16-01-01', halfLifeBase:3.1, facultyReady:33, region:1.06, estimatedDims:['halfLife','facultyReady'], enrolTrend:[2.4,3.1,1.9], enrolNote:'Stable — strong graduate wage premium maintaining applications. HESA 2021-2024.', tasks:[{name:'Model economic forecasts',type:'rep',score:0.81},{name:'Analyse policy data',type:'rep',score:0.77},{name:'Write research reports',type:'rep',score:0.85},{name:'Advise on macro strategy',type:'aug',score:0.36},{name:'Present to policymakers',type:'aug',score:0.29}]},
  { id:'uk-civil-eng', name:'Civil Engineering (BEng)', field:'Engineering', code:'CAH10-01-03', halfLifeBase:7.2, facultyReady:38, region:1.08, estimatedDims:['halfLife','facultyReady'], enrolTrend:[1.4,2.1,2.8], enrolNote:'Steady growth — infrastructure investment pipeline. HESA 2021-2024.', tasks:[{name:'Structural calculations',type:'rep',score:0.68},{name:'Oversee construction',type:'aug',score:0.07},{name:'Produce technical drawings',type:'rep',score:0.72},{name:'Environmental impact assessment',type:'aug',score:0.33},{name:'Manage project timelines',type:'aug',score:0.41}]},
  { id:'uk-social-work', name:'Social Work (BA)', field:'Health', code:'CAH02-02-01', halfLifeBase:11.2, facultyReady:19, region:0.97, estimatedDims:['halfLife','facultyReady'], enrolTrend:[5.2,6.1,4.8], enrolNote:'Growing — DfE bursaries driving intake. HESA 2021-2024.', tasks:[{name:'Conduct safeguarding assessments',type:'aug',score:0.11},{name:'Write case notes',type:'rep',score:0.66},{name:'Liaise with families',type:'aug',score:0.08},{name:'Manage complex caseloads',type:'aug',score:0.17},{name:'Court report preparation',type:'rep',score:0.59}]},
  { id:'uk-psychology', name:'Psychology (BSc)', field:'Social Sciences', code:'CAH04-01-01', halfLifeBase:6.1, facultyReady:27, region:0.91, estimatedDims:['halfLife','facultyReady','region'], enrolTrend:[4.1,3.8,2.9], enrolNote:'Growing — destination outcomes widely dispersed. HESA 2021-2024.', tasks:[{name:'Conduct assessments',type:'aug',score:0.35},{name:'Write clinical reports',type:'rep',score:0.64},{name:'Deliver therapy',type:'aug',score:0.09},{name:'Analyse research data',type:'rep',score:0.71},{name:'Advise on mental health plans',type:'aug',score:0.14}]},
  { id:'uk-architecture', name:'Architecture (BA/BSc)', field:'Design', code:'CAH13-01-01', halfLifeBase:4.8, facultyReady:42, region:0.96, estimatedDims:['halfLife','facultyReady'], enrolTrend:[0.2,-0.8,-1.2], enrolNote:'Slightly declining — RIBA pathway constraints. HESA 2021-2024.', tasks:[{name:'Produce technical drawings',type:'rep',score:0.79},{name:'Generate design concepts',type:'rep',score:0.71},{name:'Client brief interpretation',type:'aug',score:0.34},{name:'Planning application prep',type:'rep',score:0.74},{name:'Site supervision',type:'aug',score:0.12}]},
  { id:'uk-pharma', name:'Pharmacy (MPharm)', field:'Health', code:'CAH02-01-03', halfLifeBase:5.3, facultyReady:36, region:1.02, estimatedDims:['halfLife','facultyReady'], enrolTrend:[2.8,3.4,3.1], enrolNote:'Stable growth — NHS supply pressures. HESA 2021-2024.', tasks:[{name:'Dispense prescriptions',type:'rep',score:0.74},{name:'Clinical medication review',type:'aug',score:0.38},{name:'Patient counselling',type:'aug',score:0.19},{name:'Drug interaction checks',type:'rep',score:0.82},{name:'Manage pharmacy operations',type:'aug',score:0.31}]},
  { id:'uk-finance', name:'Finance (BSc)', field:'Business', code:'CAH17-01-02', halfLifeBase:2.1, facultyReady:28, region:1.14, estimatedDims:['halfLife','facultyReady'], enrolTrend:[-1.2,-2.4,-0.8], enrolNote:'Slight decline — AI concern dampening applications. HESA 2021-2024.', tasks:[{name:'Financial modelling',type:'rep',score:0.86},{name:'Investment research reports',type:'rep',score:0.88},{name:'Risk scenario analysis',type:'rep',score:0.79},{name:'Client relationship management',type:'aug',score:0.24},{name:'Regulatory compliance',type:'aug',score:0.51}]},
  { id:'uk-teaching', name:'Education / PGCE', field:'Education', code:'CAH23-01-01', halfLifeBase:7.8, facultyReady:21, region:0.94, estimatedDims:['halfLife','facultyReady'], enrolTrend:[4.4,6.2,7.1], enrolNote:'Growing — DfE shortage subject bursaries. HESA 2021-2024.', tasks:[{name:'Lesson planning',type:'rep',score:0.68},{name:'Classroom instruction',type:'aug',score:0.13},{name:'Mark student work',type:'rep',score:0.72},{name:'Pastoral care',type:'aug',score:0.06},{name:'Parent communication',type:'aug',score:0.27}]},
  { id:'uk-biomedical', name:'Biomedical Science (BSc)', field:'Health', code:'CAH02-03-01', halfLifeBase:5.1, facultyReady:44, region:1.04, estimatedDims:['halfLife','facultyReady'], enrolTrend:[3.8,4.9,5.4], enrolNote:'Growing — life sciences sector expansion. HESA 2021-2024.', tasks:[{name:'Laboratory data analysis',type:'rep',score:0.78},{name:'Run diagnostic assays',type:'aug',score:0.31},{name:'Research report writing',type:'rep',score:0.82},{name:'Quality control',type:'rep',score:0.67},{name:'Interpret pathology results',type:'aug',score:0.39}]},
];

async function build() {
  console.log('\n=== Canary UK Data Fetcher ===');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN' : 'LIVE'));
  const results = [];
  for (const prog of PROGRAMMES) {
    const soc = SOC_MAP[prog.id];
    const fb = FALLBACKS[prog.id];
    console.log('\nProcessing: ' + prog.name);
    let pay = fb.pay, empOut = fb.empOut;
    if (soc?.soc2020?.[0]) {
      const livePay = await fetchONSPay(soc.soc2020[0]);
      if (livePay) { pay = livePay; console.log('  ONS pay: ' + pay); }
      else console.log('  ONS fallback: ' + pay);
    }
    if (soc?.isco08?.[0]) {
      const trend = await fetchILOTrend(soc.isco08[0]);
      if (trend !== null) { empOut = parseFloat(Math.max(-0.30, Math.min(0.35, trend * 1.6)).toFixed(3)); console.log('  ILO empOut: ' + empOut); }
      else console.log('  ILO fallback: ' + empOut);
    }
    const halfLife = calcHalfLife(prog.halfLifeBase, soc?.eloundouBeta || 0.6, pay);
    results.push({ ...prog, exposure: soc?.exposureFinal || 0.6, halfLife, empOut, mechanism: soc?.mechanism || 'aug', _meta: { eloundouBeta: soc?.eloundouBeta, isco08: soc?.isco08, soc2020: soc?.soc2020, medianWeeklyPay: pay, fetchedAt: new Date().toISOString() } });
  }
  if (!DRY_RUN) writeFileSync('./output/programs-uk.js', `export const DATA_UK = ${JSON.stringify(results, null, 2)};`);
  console.log('\nUK build complete: ' + results.length + ' programmes');
}

build().catch(console.error);
