# Search Console datasets

Goal: Fix the actionable Google Search Console Dataset structured-data issue from the May 2026 export.

Status: complete

Scope:
- Add required `description` fields to the three sitewide `Dataset` JSON-LD entries.
- Add factual `creator` metadata that points at the existing Machtblick organization node.
- Leave `license` untouched until the operator chooses an explicit dataset license or license notice URL.

Log:
- 2026-05-20 - lead: Inspected the Search Console export. It reports 3 invalid Dataset items, all missing `description`, plus non-critical warnings for `license` and `creator`.
- 2026-05-20 - lead: Added `description` and `creator` to the three Dataset JSON-LD entries in `apps/bundestag/src/routes/__root.tsx`. TypeScript check passed.
