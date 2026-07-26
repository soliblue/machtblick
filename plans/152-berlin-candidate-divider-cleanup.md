# 152 Berlin candidate divider cleanup

## Goal

Remove the horizontal divider treatment from Berlin candidate details so the hierarchy matches Machtblick member details, then commit and push the complete Berlin Landtag work on `berlin-landtag`.

## Status

- divider audit: complete
- candidate detail cleanup: complete
- rendered QA: complete
- commit scope audit: complete
- branch creation: complete
- commit, rebase and push: complete

## Product contract

- Candidate identity statistics use spacing, not top rules.
- Contact and evidence sections use spacing, not section rules.
- Borders that define controls, source cards, and tab surfaces remain.
- Programme topic rules are reviewed separately from the visible profile dividers.
- Only intended Berlin Landtag work and its required shared infrastructure enter the commit.

## Log

- 2026-07-26 operator: Remove the visible dividers because existing Machtblick member details do not use them, then commit and push on `berlin-landtag`.
- 2026-07-26 audit: Remove rules from candidacy facts, candidate links, candidate evidence, and party topics. Keep control outlines, the monogram circle, priority accent rails, and navigation chrome.
- 2026-07-26 implementation: Removed candidate detail section rules while retaining tab, action, navigation and footer control outlines.
- 2026-07-26 QA: Mobile and desktop candidate details have no `.border-t` elements in `main`, all available tabs switch correctly, layouts do not overflow and the browser reports no console or page errors.
- 2026-07-26 scope: Audited the full worktree and found the Berlin app, Berlin data, shared design system and required Bundestag navigation integration form one intended feature set.
- 2026-07-26 branch: Committed the feature on `berlin-landtag`, rebased it onto current `origin/main`, reran the build and browser checks, and pushed the branch upstream.
