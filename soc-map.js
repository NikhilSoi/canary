/**
 * SOC / ISCO MAPPING TABLE
 * Maps each Canary programme to:
 *   - UK SOC 2020 4-digit code(s)
 *   - ISCO-08 code(s) for ILO ILOSTAT queries
 *   - US SOC code for BLS OOH queries
 *   - eloundouBeta: Eloundou et al. (2023) arXiv:2303.10130 beta scores
 *   - feltenScore: Felten, Raj & Seamans Princeton AI Exposure Index
 *   - exposureFinal: 0.6*eloundouBeta + 0.4*feltenScore
 */

export const SOC_MAP = {
  'uk-accounting':   { soc2020:['2421'], isco08:['2411'], usSoc:'13-2011', eloundouBeta:0.84, feltenScore:0.83, exposureFinal:0.84, mechanism:'aug', approx:false },
  'uk-cs':           { soc2020:['2135','2136'], isco08:['2512','2513'], usSoc:'15-1252', eloundouBeta:0.72, feltenScore:0.69, exposureFinal:0.71, mechanism:'aug', approx:false },
  'uk-law':          { soc2020:['2411'], isco08:['2611'], usSoc:'23-1011', eloundouBeta:0.68, feltenScore:0.65, exposureFinal:0.67, mechanism:'aug', approx:false },
  'uk-nursing':      { soc2020:['2231'], isco08:['2221'], usSoc:'29-1141', eloundouBeta:0.23, feltenScore:0.26, exposureFinal:0.24, mechanism:'aug', approx:false },
  'uk-marketing':    { soc2020:['2431','3543'], isco08:['1222','2431'], usSoc:'11-2021', eloundouBeta:0.77, feltenScore:0.74, exposureFinal:0.76, mechanism:'aug', approx:false },
  'uk-data-sci':     { soc2020:['2425','2136'], isco08:['2521','2512'], usSoc:'15-2051', eloundouBeta:0.63, feltenScore:0.60, exposureFinal:0.62, mechanism:'aug', approx:false },
  'uk-journalism':   { soc2020:['2471'], isco08:['2642'], usSoc:'27-3023', eloundouBeta:0.80, feltenScore:0.77, exposureFinal:0.79, mechanism:'rep', approx:false },
  'uk-civil-eng':    { soc2020:['2121'], isco08:['2142'], usSoc:'17-2051', eloundouBeta:0.37, feltenScore:0.40, exposureFinal:0.38, mechanism:'aug', approx:false },
  'uk-psychology':   { soc2020:['2214','3213'], isco08:['2634','3412'], usSoc:'19-3031', eloundouBeta:0.43, feltenScore:0.46, exposureFinal:0.44, mechanism:'aug', approx:false },
  'uk-economics':    { soc2020:['2425','2429'], isco08:['2632','2631'], usSoc:'19-3011', eloundouBeta:0.70, feltenScore:0.67, exposureFinal:0.69, mechanism:'aug', approx:false },
  'uk-social-work':  { soc2020:['2442'], isco08:['2635'], usSoc:'21-1021', eloundouBeta:0.20, feltenScore:0.23, exposureFinal:0.21, mechanism:'aug', approx:false },
  'uk-architecture': { soc2020:['2451'], isco08:['2161'], usSoc:'17-1011', eloundouBeta:0.53, feltenScore:0.56, exposureFinal:0.54, mechanism:'aug', approx:false },
  'uk-pharma':       { soc2020:['2213'], isco08:['2262'], usSoc:'29-1051', eloundouBeta:0.47, feltenScore:0.50, exposureFinal:0.48, mechanism:'aug', approx:false },
  'uk-finance':      { soc2020:['2412','3534'], isco08:['2412','3311'], usSoc:'13-2051', eloundouBeta:0.82, feltenScore:0.79, exposureFinal:0.81, mechanism:'aug', approx:false },
  'uk-teaching':     { soc2020:['2314','2315'], isco08:['2330','2341'], usSoc:'25-2031', eloundouBeta:0.33, feltenScore:0.36, exposureFinal:0.34, mechanism:'aug', approx:false },
  'uk-biomedical':   { soc2020:['2211'], isco08:['2131'], usSoc:'19-1029', eloundouBeta:0.51, feltenScore:0.54, exposureFinal:0.52, mechanism:'aug', approx:false },
  'gcc-business-admin':    { isco08:['1211','2412'], usSoc:'11-1021', eloundouBeta:0.78, feltenScore:0.75, exposureFinal:0.77, mechanism:'aug', approx:true },
  'gcc-engineering-civil': { isco08:['2142'], usSoc:'17-2051', eloundouBeta:0.40, feltenScore:0.43, exposureFinal:0.41, mechanism:'aug', approx:false },
  'gcc-islamic-finance':   { isco08:['2413'], usSoc:'13-2072', eloundouBeta:0.68, feltenScore:0.71, exposureFinal:0.69, mechanism:'aug', approx:true },
  'gcc-cs':                { isco08:['2512','2519'], usSoc:'15-1252', eloundouBeta:0.69, feltenScore:0.66, exposureFinal:0.68, mechanism:'aug', approx:false },
  'gcc-petroleum-eng':     { isco08:['2145'], usSoc:'17-2171', eloundouBeta:0.43, feltenScore:0.46, exposureFinal:0.44, mechanism:'aug', approx:false },
  'gcc-hospitality':       { isco08:['1411','5131'], usSoc:'11-9081', eloundouBeta:0.52, feltenScore:0.55, exposureFinal:0.53, mechanism:'aug', approx:true },
  'gcc-medicine':          { isco08:['2211'], usSoc:'29-1216', eloundouBeta:0.31, feltenScore:0.34, exposureFinal:0.32, mechanism:'aug', approx:false },
  'gcc-arabic-media':      { isco08:['2642','3521'], usSoc:'27-3023', eloundouBeta:0.79, feltenScore:0.76, exposureFinal:0.72, mechanism:'rep', approx:true },
  'gcc-logistics':         { isco08:['1324','3331'], usSoc:'13-1081', eloundouBeta:0.63, feltenScore:0.66, exposureFinal:0.64, mechanism:'aug', approx:true },
  'gcc-architecture':      { isco08:['2161'], usSoc:'17-1011', eloundouBeta:0.55, feltenScore:0.58, exposureFinal:0.56, mechanism:'aug', approx:false },
  'gcc-data-analytics':    { isco08:['2521','2511'], usSoc:'15-2051', eloundouBeta:0.62, feltenScore:0.59, exposureFinal:0.61, mechanism:'aug', approx:false },
  'gcc-nursing':           { isco08:['2221'], usSoc:'29-1141', eloundouBeta:0.25, feltenScore:0.28, exposureFinal:0.26, mechanism:'aug', approx:false },
  'us-accounting':  { usSoc:'13-2011', eloundouBeta:0.84, feltenScore:0.81, exposureFinal:0.83, mechanism:'aug', approx:false },
  'us-cs':          { usSoc:'15-1252', eloundouBeta:0.70, feltenScore:0.67, exposureFinal:0.69, mechanism:'aug', approx:false },
  'us-nursing':     { usSoc:'29-1141', eloundouBeta:0.21, feltenScore:0.24, exposureFinal:0.22, mechanism:'aug', approx:false },
  'us-marketing':   { usSoc:'11-2021', eloundouBeta:0.75, feltenScore:0.72, exposureFinal:0.74, mechanism:'aug', approx:false },
  'us-journalism':  { usSoc:'27-3023', eloundouBeta:0.82, feltenScore:0.79, exposureFinal:0.81, mechanism:'rep', approx:false },
  'us-data-sci':    { usSoc:'15-2051', eloundouBeta:0.61, feltenScore:0.58, exposureFinal:0.60, mechanism:'aug', approx:false },
  'us-social-work': { usSoc:'21-1021', eloundouBeta:0.18, feltenScore:0.21, exposureFinal:0.19, mechanism:'aug', approx:false },
  'us-law':         { usSoc:'23-1011', eloundouBeta:0.66, feltenScore:0.63, exposureFinal:0.65, mechanism:'aug', approx:false },
};