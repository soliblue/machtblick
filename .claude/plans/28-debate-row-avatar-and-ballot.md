# 28 — Debate row: avatar circle + ballot pill

## Goal

On the Reden tab of a vote page, each speech row should render as:

```
[avatar 36px]   Speaker Name              [PILL]  ⌄
                CDU/CSU
                excerpt line, two lines clamped…
```

- **Avatar circle** (36px, rounded-full): the speaker's `members.pictureUrl`, with the existing initials-on-surface fallback. Mirrors `DefectorRow` exactly.
- **Ballot pill** (right side): the speaker's actual choice in *this* vote — Ja / Nein / Enth. / –. Mirrors `VoteChoicePill` exactly.
- Pill is **per-vote**, so on a multi-vote TOP (e.g. TOP 32 = vote 987 + vote 988) a speaker's pill reflects their choice on the specific vote page being rendered. Naturally correct: the ballot lookup happens on the view, against that page's `memberBallots`.

## Reuses

- `apps/bundestag/src/views/memberDetail/VoteChoicePill.tsx` — pill component, identical visual to defector list.
- `apps/bundestag/src/views/voteDetail/DefectorRow.tsx` — copy the avatar + initials pattern (img tag, fallback div, 36px round).
- `apps/bundestag/src/lib/initials.ts` — initials helper.

## Edge cases

- **Government speakers / president** (`speakerMemberId = null`): no avatar img (show initials fallback from `speakerName`), no pill. They have a role label already.
- **MP who didn't vote**: `voteMembers` carries every MP for namentlich votes including `nicht_abgegeben`, so pill renders as the dimmed `–`. Consistent with everywhere else.
- **Non-namentlich votes** (handzeichen / hammelsprung): `memberBallots` is empty → no pills, but avatars still render. Acceptable; pill is opt-in.

## Approach

Two changes:

### A. Backend — `apps/bundestag/src/server/votes.ts`
`memberBallots` projection in `getVote` currently drops `pictureUrl` from `rawVmRows`. Re-add it:

```ts
memberBallots: vmRows.map((r) => ({
  memberId: r.memberId,
  name: r.name,
  party: r.party,
  choice: r.choice,
  pictureUrl: r.pictureUrl,
})),
```

Update the `VoteDetail.memberBallots` element type accordingly. No new query — `rawVmRows` already selects `members.pictureUrl`.

### B. Frontend
1. **`SpeechRow` (`apps/bundestag/src/views/redenSearch/SpeechRow.tsx`)** — accept two optional props:
   - `pictureUrl?: string | null`
   - `choice?: MemberVoteRow['choice'] | null`
   Add a 36px avatar column on the left of the existing grid. Add a `VoteChoicePill` to the right of the content, before the chevron. Skip the avatar+pill on rows where speaker has `speakerRole` (preserve the role-label inline). When `pictureUrl` is null but `speakerMemberId` is set, fall back to the initials-on-surface circle from `DefectorRow`.

   Existing `/reden` search call site passes neither prop → row degrades back to today's layout (no avatar, no pill). That keeps the redenSearch view unchanged for now.

2. **`DebateList.tsx`** — accept a new prop `ballotByMember: Map<string, { choice: MemberVoteRow['choice']; pictureUrl: string | null }>`. Build inside `SpeechesTab` from `data.memberBallots`. Pass per-speech values down to `SpeechRow`.

3. **`SpeechesTab.tsx`** — build the map once and pass to `DebateList`.

## Contracts

`VoteDetail.memberBallots[number]` gains `pictureUrl: string | null`. No other type changes. `SpeechSummary` untouched.

## Acceptance

- `/votes/2025-12-05-987-…-staatsvermogen` Reden tab: each MP row shows a 36px portrait on the left and a colored Ja/Nein/Enth./– pill on the right. Vizepräsident Ramelow's row shows initials circle, no pill.
- Same on `/votes/2025-12-05-988-…-atomgeschaften`. A speaker who voted differently on 987 vs 988 (if any) shows the correct pill per page.
- `/reden` search page is visually unchanged (no avatar, no pill — props omitted).
- Build passes; prerender of both vote pages green.

## Status

- backend: done (A)
- frontend: todo (B, after backend confirms the projection)

## Log

### backend — 2026-05-14
- Touched `apps/bundestag/src/server/votes.ts`:
  - `VoteDetail.memberBallots` element type widened with `pictureUrl: string | null`.
  - Projection in `getVote` now passes `pictureUrl: r.pictureUrl` (already in `rawVmRows` select).
- `npm run build` clean (prerender green across all routes, no TS errors or warnings).
- Consumer audit (`grep memberBallots`): only `ResultTab.tsx` → `PartyWaffle.tsx`. `PartyWaffle` declares its own local narrow `Ballot` type (`memberId/name/party/choice`); a wider object is structurally assignable, so no surprise.
