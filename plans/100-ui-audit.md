# 100 UI Audit

## Goal
User asked "how can we improve the UI of this website". Audit the live bundestag app screen by screen and produce a prioritized list of concrete UI improvements. Output of this plan is the findings list; implementation gets its own follow-up plans.

## Status
- dev server bring-up: done (launcher)
- audit: done (designer). Screenshots in /tmp/ui-audit (fold-* = viewport, mid-* = mid-scroll, *-desktop/-mobile)

## Contracts
- Dev server: vite on :5174, live at https://dev.machtblick.de (see lead memory for bring-up)
- Routes to audit: / (votes list), /votes/$id, /members, /members/$id, /parties, /parties/$id, /motions, /speeches
- Existing mocks: apps/bundestag/src/views/<view>/<view>.mock.md
- Design tokens: CLAUDE.md Design section (fixed scales, 3 surface shades, 16 accents)

## Findings

1. **/votes/ — result numbers and party split invisible in the list.** Each row spends ~220px on a large donut that encodes only rough Ja/Nein/Enthaltung proportions; no counts anywhere, ~3.5 votes per screen, and the mock (votesList.mock.md) specifies the house idiom instead: a compact horizontal stacked bar with Ja/Nein/Enth counts inline. Fix: replace the donut with the stacked result bar + counts, tighten rows to roughly half the height. Effort: M

2. **/votes/$id — the Ergebnis tab never states the numbers.** The donut shows only "630" (total) in the center; Ja/Nein/Enthaltung/nicht abgegeben counts exist only in tooltips, and there is no legend for green/red/yellow/gray (donut and waffle both). Mock specifies loud totals ("Ja 412 Nein 198 Enth 24 Abw 32"). Fix: add a counts row above/beside the donut that doubles as the color legend. Effort: S

3. **/members (mobile) — table headers "Partei" and "Anwesenheit" overlap at 390px.** Rendering bug, the two header labels collide into "PartAnwesenheit" (see crop-members-header-mobile.png). Fix: give the Partei column a fixed narrow width or drop its header label on mobile. Effort: S

4. **/members/$id Abstimmungen — the MP's own vote is not the story.** Every row is dominated by the same repeated ANGENOMMEN outcome stamp while the member's vote is a tiny chip at the far right, and absent votes render as an unexplained "-". votingRecord.mock.md already specifies the redesign (term ribbon + topic galaxy, vote-colored row markers). Fix: implement the mock, or minimally swap emphasis (member vote left and colored, outcome as faint trailing chip) and label "-" as "Nicht abgegeben". Effort: L (mock) / S (emphasis swap)

5. **/speeches — moderation interjections drown the actual speeches.** Roughly half the rows are "Vielen Dank... nächste:r Redner:in" handovers, and the president rows double the role ("Vizepräsident Omid Nouripour · Vizepräsident"). Fix: collapse Sitzungsleitung entries into a thin divider row (expandable), strip the role prefix from the name. Effort: M

6. **/parties/$id — Großspenden renders as anonymous gray blocks.** Three unlabeled rectangles in bespoke grays; donor and amount only on hover, meaningless at a glance and off-palette. Fix: label segments with donor + amount (inside when wide, legend list beneath when narrow), use token opacities of fg instead of bespoke grays. Effort: M

7. **/members, /votes/$id — inconsistent person name format.** "Klingbeil, Lars" and "Klaus Wiener" mix Last-First and First-Last in the same table, and the Abweichungen list on vote detail mixes them too. Data fix per project rule (fix data, not symptoms): normalize name fields in ETL. Effort: S

8. **/members — Bundesland column is empty for ~95% of rows.** A whole desktop column renders blank (only a few rows have a value), reading as broken. Fix: backfill in ETL or hide the column until coverage exists. Effort: S

9. **/parties — no page title and no Regierung/Opposition status.** The mock specifies a coalition badge per party row; live shows only seat counts, so the single most basic fact (who governs) is absent. Hemicycle also uses circles where the house convention says squares. Fix: add Regierung/Opposition Badge per row, square hemicycle marks. Effort: S

10. **/votes/ — redundant meta noise on every row.** "NAMENTLICH" repeats on all rows while the default filter is already Namentlich, and sponsor identity is doubled (party logo + colored party-name badge side by side, also in the member header). Fix: show the vote type only when it differs from the active filter; pick logo or badge, not both. Effort: S

11. **all list views — filter rows drop the house convention.** FilterPill rows on /votes/, /members, /speeches lack the leading `Filter` icon (size 14, opacity-l) the convention requires, so the pills read as buttons rather than filters. Fix: prepend the icon in the shared FilterPills row. Effort: S

12. **/speeches — pagination and truncation hurt reading.** "1 2 ... 5716" numeric pagination is hostile for a browse-first page, and desktop teasers cut mid-word without ellipsis ("an der N"). Fix: load-more/infinite scroll, CSS line-clamp for teasers. Effort: M

13. **/motions/$id — unlabeled Bundesland badge row.** The state badges under the title (Hamburg, Berlin, ...) have no caption saying these are the einbringenden Länder, so they read as tags. Fix: add a text-s uppercase caption ("Antrag der Länder") before the badges. Effort: S

## Open questions
- Which findings does the user want implemented first?

## Log
- lead: created plan, dispatching launcher then designer
- launcher: vite dev up on http://localhost:5174 (pid 205995, nohup+disown, log /tmp/machtblick-launcher/bundestag-5174.log), / 307s to /votes/ which returns 200
- designer: audited 8 routes in 390x844 and 1440x900 via Playwright, screenshots in /tmp/ui-audit, compared against mocks; 13 prioritized findings written above. Biggest themes: vote numbers/party split invisible (list donuts vs mock's stacked bars), mobile members-table header collision, member voting record ignores votingRecord.mock.md, name-format inconsistency is an ETL fix
