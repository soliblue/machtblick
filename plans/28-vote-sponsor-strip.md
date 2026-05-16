# 28 — Vote detail: overlapping portrait strip of Antrag co-signers

## Goal

Show, near the top of `/votes/:id`, the MdBs who authored / co-signed the underlying Antrag(e) or Gesetzentwürfe — as **overlapping portrait avatars** ("face pile"), small. Each portrait links to that member's profile.

When there are zero sponsors (Bundesregierungs-Gesetzentwürfe, handzeichen votes without document refs, vorgangstypen we don't ingest — see plan 26 audit), the strip is **omitted entirely**. No empty state, no fallback text.

Scope: WP21 only. **Vote detail page only — no Anträge tab on member profile in this plan.**

## Status

| Workstream | Owner | State |
|---|---|---|
| ASCII mock — sponsor strip placement + face-pile spec | designer | todo |
| Server fn `getVoteSponsors(voteId)` + exported types | backend | done |
| Frontend — `SponsorStrip.tsx` + wire into vote-detail loader | frontend | done |
| Smoke check via tester on dev tunnel | lead | todo |

## Data — already shipped in plan 26

- `vote_antraege(voteId, antragId)` — many-to-many. PK composite.
- `antraege(id, type, title, drucksache, ...)`
- `antrag_signatories(antragId, memberId, dipPersonId)` — PK `(antragId, memberId)`.
- `members.portraitUrl` (plan 15), `members.firstName`, `members.lastName`, `members.slug` (or `members.id` — check field name).
- Party-at-date resolution: `loadAffiliationsByMember()` + `partyAt(list, vote.date)` — the time-range util already used by votes/anfragen.

Coverage numbers (from plan 26): 180 of 300 WP21 votes have ≥1 linked Antrag, ~12k total signatures.

## Contract — server fn

```ts
// apps/bundestag/src/server/voteSponsors.ts
export const getVoteSponsors = createServerFn(...)
  .validator((voteId: string) => voteId)
  .handler(...)

export type VoteSponsorMember = {
  memberId: string                  // for /members/:id link
  displayName: string               // "Vorname Nachname"
  partyAtDate: string | null        // resolved via member_affiliations at vote.date
  portraitUrl: string | null
}

export type VoteSponsorAntrag = {
  antragId: number
  type: 'antrag' | 'gesetzentwurf'
  title: string
  drucksache: string | null
  signatories: VoteSponsorMember[]  // ordered by last name; full list, frontend caps
}

export type VoteSponsors = { antraege: VoteSponsorAntrag[] }   // may be []
```

Query path:
```
vote_antraege WHERE vote_id = ?
  → antraege (join)
    → antrag_signatories (join)
      → members (join)
        → member_affiliations (party at vote.date)
```

**Must run from the vote-detail route loader, not `useQuery`.** Cloudflare Pages prerender rule (see `project_server_fns_via_loaders`). The existing vote-detail loader already runs server fns for the rest of the page — extend it, don't add a parallel one.

## Designer brief (mock at `apps/bundestag/src/views/voteDetail/sponsorStrip.mock.md`)

Output: a mock + tokens. Reference the existing vote-detail mock at `apps/bundestag/src/views/voteDetail/voteDetail.mock.md` for the surrounding layout.

Constraints, all hard:

- **Placement:** between the proposer/date line and the "Worum geht es" summary card. Never pushes the result section down by more than the strip's own height.
- **Face pile:** circular portraits overlapping ~30–40% horizontally, descending z-index left-to-right (leftmost on top). Border = `background` color (white in light theme) so each face cuts a clean disc out of the next. Portrait size = icon `xl` (26 px) or thereabouts — your call, but match the design token scale, no bespoke px.
- **Cap:** ~8 visible portraits, then a `+N` chip with the same diameter as a portrait, neutral background, text size `s` semibold. Tapping `+N` is out of scope for v1 (no modal); it can be inert or a `title` tooltip listing names.
- **Multiple Anträge per vote:** designer's call. Options to consider: (a) one merged pile across all Anträge with the count labelled, (b) one pile per Antrag stacked vertically with Antrag title above. Pick the one that holds up when there are 2–3 Anträge on one vote. Bundle votes don't need to scale to 30 piles — if a vote has >3 Anträge, collapse to a single combined pile and label as "Anträge: N".
- **Caption:** a short label like `Eingebracht von` to the left of the pile, text size `s`, opacity-l. No icon.
- **Hover:** portrait shows tooltip with `Vorname Nachname · Partei`. Click → `/members/:id/`.
- **Layout stability:** reserve height so portrait images loading in don't cause CLS. Use the portrait diameter as fixed height on the wrapper.
- **Zero sponsors:** the strip and its caption are **not rendered at all**. No "Keine ..." text.

Mock should show two states: (1) ~12 signatories from one Antrag, hitting the `+4 weitere` cap; (2) a vote with two Anträge.

Open questions for lead — append to mock if any, but try to decide them yourself first.

## Frontend brief (after mock lands)

- `apps/bundestag/src/views/voteDetail/SponsorStrip.tsx` — presentational. Props match `VoteSponsors`. Render nothing when `antraege.length === 0` or all `signatories` are empty.
- Wire into the existing vote-detail loader; read via `Route.useLoaderData()`.
- Use shadcn Avatar primitive only if it's already in the curated set; otherwise plain `<img>` with `rounded-full` and inline `style={{ marginLeft: -8 }}`-style negative margins (token-derived).
- Sharp corners are the project default — exception here is the portrait disc itself, which is circular. Border between overlapping portraits gets `background`-color stroke at `stroke-m` (1.5 px).

## Open questions for lead

- ✅ Scope locked: vote-page only this plan. No Anträge tab on member profile yet — operator wants to check the raw data before deciding.
- ✅ Zero-sponsor state: omit entirely.
- ✅ Multiple-Antrag handling: designer's call within the constraints above.

## Log

- 2026-05-14 (lead) — Plan created. Designer dispatched for the sponsor-strip mock. Backend + frontend held until mock lands.
- 2026-05-14 (designer) — Mock at `apps/bundestag/src/views/voteDetail/sponsorStrip.mock.md`. State B uses option (b), one stacked pile per Antrag with Antrag-type/Drucksache caption, because the political story in multi-Antrag votes is which faction tabled which motion; merging would hide that. 32 px portrait disc, inert `+N` chip with `title` listing remaining names. No open questions.
- 2026-05-14 (backend) — Shipped `apps/bundestag/src/server/voteSponsors.ts`. Field-name verification: route uses `members.id` (kebab slug, e.g. `bartsch-dr-dietmar`); there is no `members.slug` column. Portrait field on the schema is `members.pictureUrl` (renamed to `portraitUrl` in the exported contract per the plan). `loadAffiliationsByMember()` + `partyAt(list, vote.date)` reused from `./memberParty`. Typecheck clean (no new errors above pre-existing baseline in `parties.ts`). Smoke against `2026-03-05-995-umgestaltung-des-burgergelds-zu-neuer-grundsicherung` (top of `vote_antraege` count): 5 Anträge returned (1 Gesetzentwurf, 4 Anträge), signatory counts 10 / 0 / 39 / 41 / 11. Party-at-date resolved correctly across AfD / Die Linke / B90/Grüne in the same payload. Signatories sorted by `lastName` then `firstName`. Note: `members.firstName` carries embedded honorifics ("Dr. Michael", "Prof. Dr. Armin") because that is how DIP stores them; `displayName` preserves them, consistent with the rest of the app (existing `members.name` is "Bartsch, Dr. Dietmar"). Frontend can render as-is.
- 2026-05-14 (frontend) — Shipped. Files added: `apps/bundestag/src/views/voteDetail/SponsorStrip.tsx` (top-level switcher: zero, 1, 2-3 stacked, >3 merged), `SponsorPile.tsx` (cap=8 portraits then `+N` chip with `title` listing remaining names), `SponsorPortrait.tsx` (Link to `/members/$id/`, Tooltip with `Name · Partei`, fallback initials disc when `portraitUrl` is null). Wired the loader in `apps/bundestag/src/routes/votes/$id.tsx` to `Promise.all([getVote, getVoteSponsors])`, spreading sponsors onto the existing payload as `data.sponsors`. Slotted `<SponsorStrip>` between the stamps row and the "Worum geht es" summary in `VoteDetail.tsx`. `npx tsc --noEmit` clean (only the pre-existing `parties.ts` cohesion-null baseline error remains). Dev test routes: `/votes/2025-09-11-959-ablehnung-eines-antrags-uber-ein-moratorium-zum-ruckbau-abgeschalteter/` (State A, 50 signatories rendering 8 portraits + `+42` chip), `/votes/2026-04-24-1000-gesetzentwurf-der-grunen-zur-anderung-der-stromsteuer/` (State B, 3 Anträge stacked with per-block caption), `/votes/2026-03-05-995-umgestaltung-des-burgergelds-zu-neuer-grundsicherung/` (4 Anträge with signatories of 10/39/41/11, triggers merged-pile fallback with `Anträge: 4`). Deviations from the mock: Antrag-type label renders only `Antrag` and `Gesetzentwurf` (the two values the backend union actually emits); the mock's illustrative "Aenderungsantrag" string is out of contract scope, so omitted. Caption-to-pile spacing implemented via `gap-s` on the flex row rather than `mr-s` on the caption itself; visually identical.
