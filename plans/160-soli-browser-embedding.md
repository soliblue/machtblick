# Embed Machtblick in soli.blue

## Scope

Allow the public Machtblick website inside the Internet browser on https://soli.blue only. Preserve protection against framing by unrelated sites. Do not change application data, routes, or unrelated research.

## Tasks

- Replace X-Frame-Options DENY with enforced CSP frame-ancestors https://soli.blue.
- Align the report-only policy with the same allowed parent.
- Add a header regression test for the exact allowlist.
- Update the soli.blue browser registry, iframe policy, and browser tests.
- Verify allowed and rejected embedding with browser tests.
- Deploy both sites only after explicit confirmation; verify production headers and navigation.

## Ownership

- Main: soli.blue integration, browser verification, coordination.
- Helper: Machtblick headers and focused regression test.

## Log

- 2026-09-15 release: User explicitly approved both deployments. Full builds passed. Machtblick deployed to https://be373c9e.machtblick-bundestag.pages.dev with 10,319 files and 2/500 deployments this month; soli.blue deployed to https://f9ea5828.soli-blue.pages.dev. Custom-domain HTML hashes match both immutable deployments. Enforced frame-ancestors is exactly https://soli.blue on Machtblick home, members, and English home, with no X-Frame-Options header. Live desktop and Pixel 5 checks rendered Machtblick and navigated to members inside soli.blue without page errors or extra tabs. A real unrelated parent remained blocked. soli.blue resume API returned 200. No database, research, commit, or push changes.
- 2026-09-15 main: Updated soli.blue to embed the canonical Machtblick homepage, allow its exact frame origin, and remove the external-launch screen. Lint, build, and both desktop/mobile browser navigation tests passed. Browser verification using local response overrides for the proposed headers rendered real Machtblick content and navigated to members inside the frame on desktop and Pixel 5. A separate unrelated parent was blocked by enforced CSP. These are pre-deploy checks, not production results. Both deployments await explicit confirmation; database and unrelated research are untouched.
- Confirmed production X-Frame-Options DENY and report-only frame-ancestors none prevent embedding. The canonical entry point is /; /votes/ redirects to it.
- 2026-09-15 helper: Updated `apps/bundestag/public/_headers` to remove X-Frame-Options and enforce `Content-Security-Policy: frame-ancestors https://soli.blue`. Aligned report-only frame-ancestors with that exact origin, without self or wildcards; all other directives and headers remain unchanged. Report-only CSP does not itself block framing; enforcement now comes from the new CSP header.
- 2026-09-15 helper: Added `apps/bundestag/scripts/headers.test.mjs`. `node --test apps/bundestag/scripts/headers.test.mjs` passed all 5 tests covering header parsing, duplicate rejection, absence of X-Frame-Options, the exact enforced single-origin allowlist, aligned report-only framing, and preservation of all other policies and path blocks. `git diff --check` passed. No app code, builds, deploys, commits, pushes, database changes, or edits to unrelated `research/`; browser and production verification remain with the main task.
