# 50 Active Filter Contrast

## Goal

Make active filters immediately obvious by giving selected filter pills a high-contrast visual state.

## Scope

- Change the active visual state of shared filter pills everywhere they appear.
- Prefer a dark filled active pill using `var(--color-fg)` background, `var(--color-background)` text, and `var(--color-fg)` border.
- Keep inactive pills visually quiet with transparent background and the existing low-opacity border.
- Apply the same active treatment to the member-search filter pill used on speech search.
- Preserve the current filter labels, values, reset affordance, dropdown behavior, and URL behavior.
- Do not add active-filter summary rows, counts, or new filter logic in this change.

## Affected Surfaces

- Votes list: type (`Namentlich`, `Handzeichen`, `Hammelsprung`), proposer, result, category.
- Members list: party, state, sex, age, mandate.
- Speeches search: parliamentary group, day, member.
- Vote detail debate list: parliamentary group.
- Party votes tab: party vote, result.
- Member questions tab: type, status, ministry.
- Member motions tab: status, vote link, category.
- Member voting-record tab: line and personal vote filters.

## Contracts

- Views remain presentational.
- Filter behavior stays owned by current routes and hooks.
- No new colors are introduced.
- Party color continues to mean party identity, not active state.
- Active state must be visible without relying only on color shade differences in the same light palette.
- Active pill text, icon, logo, and reset control must remain readable on mobile and desktop.

## Proposed UI

Inactive:

```text
[ Partei ]
[ Ergebnis ]
```

Active:

```text
[ Partei  SPD  x ]
[ Ergebnis  Abgelehnt  x ]
```

Active style:

```text
background: var(--color-fg)
color: var(--color-background)
border-color: var(--color-fg)
```

Inactive style:

```text
background: transparent
color: var(--color-fg)
border-color: color-mix(in oklab, var(--color-fg) 15%, transparent)
```

## Implementation Plan

1. Update `apps/bundestag/src/views/votesList/FilterPill.tsx`.
2. Update `apps/bundestag/src/views/redenSearch/MemberFilterPill.tsx` to match.
3. Ensure the reset `x` is clearly visible in the active dark state.
4. Ensure lucide icons inherit active text color instead of staying muted.
5. Check party logos in active pills. If a logo loses contrast, keep the active text treatment and either preserve the logo as-is only where readable or give the logo a tiny neutral backing using existing tokens.
6. Keep dropdown selected-row styling separate from pill active styling unless the same contrast issue appears there.
7. Update only the relevant mock notes if the visual state needs documentation. Do not redesign filter layout.

## Verification

- Run typecheck or the closest existing validation command.
- Launch the Bundestag app locally.
- Check `/votes/` with type, proposer, result, and category filters.
- Check `/members/` with party, state, sex, age, and mandate filters.
- Check `/speeches/` with parliamentary group, day, and member filters.
- Check a vote detail debate tab with a parliamentary-group filter.
- Check a party votes tab.
- Check member questions, motions, and voting-record tabs.
- Verify active, inactive, hover, focus, open dropdown, and reset states.
- Verify mobile width does not cause active pills to obscure or clip text.

## Open Questions

- Should active party filter pills keep the party logo, or should they switch to icon plus text for maximum contrast?
- Should active pills show both label and value later, for example `Partei: SPD`, or is the contrast-only fix enough?

## Status

Planned.

## Log

### lead

- Created the plan after user clarified that the core problem is weak visual contrast between inactive and active filter pills.
- Expanded scope after user clarified this must cover all filter pills, including vote type, members page filters, and detail-page filter tabs.
