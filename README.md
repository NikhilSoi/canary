# 🐦 Canary

**AI Risk Intelligence for Academic Programmes**

Canary is an open-source strategic planning tool that helps higher education leaders identify which academic programmes face the greatest disruption from AI — and what kind of response is warranted. It covers programmes across the UK, GCC/UAE, and United States.

→ **[Live demo](https://NikhilSoi.github.io/canary)**

## Six scoring dimensions

| Dimension | Weight | Source |
|---|---|---|
| Task automation potential | 33% | Eloundou et al. (2023) β scores + Felten Princeton Index |
| Enrolment trajectory | 17% | HESA Student Record / MOHESR national data |
| Curriculum half-life | 17% | O*NET task concentration + Epoch AI compute timeline |
| Faculty AI readiness | 12% | Jisc Digital Experience Insights / TIMSS educator surveys |
| Regional labour market | 11% | ONS ASHE / ILO ILOSTAT regional employment |
| Employment outlook | 10% | ONS LMI / ILO ILOSTAT / BLS OOH projections |

## Data sources

All sources are publicly available — no proprietary vendor data is used.

| Source | Type |
|---|---|
| Eloundou, Manning, Mishkin & Rock (2023) arXiv:2303.10130 | Peer-reviewed |
| Felten, Raj & Seamans Princeton AI Exposure Index | Peer-reviewed |
| ILO ILOSTAT ilostat.ilo.org/resources/ilostat-api/v1 | International |
| ONS Annual Survey of Hours and Earnings (ASHE) | Federal (UK) |
| HESA Student Record hesa.ac.uk/data-and-analysis | National (UK) |
| Working Futures 2017-2027 (DfE / Warwick IER) | Government (UK) |
| UAE Vision 2031 / KSA Vision 2030 sector targets | Government (GCC) |
| BLS Occupational Outlook Handbook | Federal (US) |

## Architecture

Single-file static web app — no backend, no database, no API keys at runtime.

```
canary/
├── index.html              ← Entire application
├── fetch-all.js            ← Master build script
├── soc-map.js              ← SOC/ISCO mapping + Eloundou β scores
├── fetchers/
│   ├── uk.js               ← ONS ASHE + ILO ILOSTAT (GBR)
│   └── gcc.js              ← ILO ILOSTAT (ARE/SAU/QAT)
└── output/                 ← Generated at build time
```

## Running the data fetcher

Requires Node.js 18+ (no npm packages needed).

```bash
node fetch-all.js --dry-run   # verify endpoints
node fetch-all.js              # live fetch
```

## Deployment

```bash
git init && git add . && git commit -m "Initial release"
git remote add origin https://github.com/NikhilSoi/canary.git
git push -u origin main
# Settings → Pages → Source → GitHub Actions → Save
```

## Limitations

- Point-in-time data — rebuild every 12–18 months
- National averages, not institutional scores — use CSV import to overlay institutional data
- GCC data quality is lower than UK/US — ISCO-08 at 1-digit major group level only
- Not a substitute for formal curriculum review

## Suggested citation

```
George, B. (2025). Canary: AI Risk Intelligence for Academic Programmes
[Open-source tool]. GitHub. https://github.com/NikhilSoi/canary
```

## Licence

MIT — free to use, adapt, and build on.

*Built on open data from ONS, ILO, HESA, and BLS, and the research of Eloundou et al. (2023) and Felten, Raj & Seamans (2023).*