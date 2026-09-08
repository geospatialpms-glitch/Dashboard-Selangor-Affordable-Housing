# Selangor Affordable Housing Intelligence — v1.3

Dashboard SUO untuk pemantauan perumahan mampu milik Negeri Selangor.

## Data integrated in v1.3
- **LPHS Q1 2025 masterlist** supplied by user: **447 records**
  - 135 siap bina — 42,779 unit
  - 60 dalam pembinaan — 25,896 unit
  - 252 dalam perancangan — 185,697 unit known (3 rows without numeric units)
- Existing verified 2026 KPI/project update records retained separately for audit trail.
- No coordinates were present in the LPHS 2025 source; latitude/longitude remain blank until geocoding + verification.

## Merge principle
The 2025 masterlist is treated as a **historical baseline**, not silently overwritten by 2026 records. Selected high-confidence historical matches enrich 2026 records with PBT/location context, while the 2026 source remains authoritative for 2026 status/KPI.

## Important files
- `projects.csv` — combined master records
- `projects.json` — web-ready version
- `lphs_district_stats_2025.json` — 2025 baseline aggregation
- `qa_report_v1.3.json` — extraction/coverage QA
- `state_summary.json` — statewide 2026 KPI + LPHS 2025 baseline summary
- `sources.json` — source registry

## GitHub Pages
Deploy from `main` → `/ (root)`.
