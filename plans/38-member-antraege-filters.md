# 38 Member Antraege Filters

## Goal

Enrich the member Antraege tab with useful filters, keep member tabs out of the UI when they have no data, align English member subroutes so the only path difference is `/en`, and show a friendly missing-page message instead of the router error UI.

## Scope

- Add filters to the member Antraege tab for data that actually exists on the rows.
- Prefer URL search params for filters that should be shareable.
- Keep the Antraege rows lean after the previous cleanup, no redundant Antrag label, faction, or Drucksache text.
- Move the English Antraege route from `/en/members/$id/proposals` to `/en/members/$id/antraege`.
- Hide empty member tabs across the detail page.
- Add a root not-found view for unknown routes and missing dynamic entities where practical.

## Contracts

- Routes stay thin and pass data into presentational views.
- New dynamic or nested routes must be included in prerender paths.
- German and English member subroutes should use the same slug except for the `/en` prefix.
- Empty tabs are not rendered as navigation targets.
- Filters must not require inefficient per-row lookups.

## Status

Implemented and verified on dev.

## Log

- lead: Started from current dirty workspace and user request to add Antraege filters.
- lead: Added route-search filters for status, topic, linked vote, and title query on member Antraege.
- lead: Aligned English member Antraege path to `/en/members/$id/antraege`.
- lead: Added hidden empty member tabs and vote detail tabs for missing detail text or debate.
- lead: Added a reusable friendly missing-page view for unknown routes and bad dynamic ids.
- lead: Converted missing member, vote, and party ids to TanStack not-found errors so they return 404 instead of 500.
- lead: Verified production build, dev Antraege routes, old `/proposals/` URL, and bad dynamic ids.
- lead: Follow-up request: remove duplicated Antraege status text and render non-voted Beratungsstand values as stamps.
- lead: Rendered Abgelehnt only once for linked votes, added stamps for Ueberwiesen and shortened Beschlussempfehlung labels.
- lead: Follow-up request: move stamps into the normal post-title meta position used by vote rows.
