# 125 Public Repository Release

## Goal

Prepare Machtblick for safe public visibility without invalidating or re-entering existing deployment secrets, publish the GitHub repository, and prove the release path with a successful iOS build and TestFlight deployment.

## Status

- Preserve and inspect current repository state: done
- Full Git history secret and privacy audit: done
- Public licensing, data, asset, and documentation audit: done
- GitHub Actions hardening without secret migration: done
- Local workflow and release verification: done where supported on Linux
- Commit and push: pending
- Public visibility and repository protections: pending
- Public GitHub-hosted iOS build: pending
- TestFlight deployment and public-build verification: pending

## Safety contracts

- Do not move, delete, rename, or recreate existing GitHub Actions secrets because their values cannot be read back and the operator must not need to enter them again.
- Do not rewrite Git history or force-push.
- Do not expose secret values in commands, logs, plan text, or committed files.
- Preserve the existing iOS build, signing, upload, TestFlight group assignment, and verification behavior.
- Public users remain read-only. Only the repository owner may update protected release branches and tags or dispatch upstream workflows.
- Do not rely on log redaction as a secret boundary.
- Keep the default GitHub token read-only and pin external Actions to immutable commits.
- Do not add privileged pull-request triggers or run untrusted pull-request code with secrets.
- Public visibility is the final external mutation after code, history, workflow, and metadata preflights pass.
- Completion requires a successful GitHub-hosted iOS build plus a successful TestFlight deployment whose uploaded build is processed and available through the existing public group.

## Preflight evidence

- Clean or explicitly preserved worktree and synchronized `main`.
- Full-history secret scanner reports no unresolved findings.
- Existing required GitHub Actions secret names are present without reading their values.
- Current collaborators, workflow triggers, token permissions, Actions allowlist, rulesets, and environments are inventoried.
- Public-facing documentation and third-party data or asset notices are sufficient without making an unrequested license grant.
- Workflow syntax, scripts, localization contracts, and release checks pass locally where supported.
- Every referenced external Action resolves to the intended upstream commit.

## Publication sequence

1. Land public-readiness and workflow-hardening changes on private `main`.
2. Confirm remote `main` matches the reviewed commit.
3. Change repository visibility to public.
4. Create active branch and release-tag rulesets with repository admins as the only bypass role.
5. Verify public anonymous readability, collaborator permissions, secret names, Actions permissions, and free standard macOS runner eligibility.
6. Trigger and monitor the iOS build workflow for the reviewed commit.
7. Trigger and monitor the TestFlight deployment for the same commit.
8. Confirm the workflow's App Store Connect and public TestFlight verification completes.

## Log

- 2026-07-12 user: authorized all necessary public-readiness changes, requested no secret migration that would require re-entry, and explicitly authorized switching the repository public and triggering a real iOS deployment after preflight confidence is established.
- 2026-07-12 lead: confirmed the worktree is clean and began parallel history, data licensing, workflow security, and release-path audits. Existing secrets will remain repository secrets so deployment stays operable without operator action.
- 2026-07-12 lead: full-history Gitleaks 8.30.1 scan covered 255 commits and 37.31 MB. Its two findings are intentional public protocol identifiers: the DIP key published in the Bundestag OpenAPI documentation and the IndexNow verification key served by the production host. No private credentials or signing material were found.
- 2026-07-12 lead: accepted the already-disclosed permanent exposure of historical operator email addresses under the no-history-rewrite contract. Removed personal forwarding details and personal User-Agent contacts from the current tree, using the public project mailbox and canonical repository URL instead.
- 2026-07-12 backend audit: confirmed only `soliblue` has repository access, the default GitHub token is read-only, no untrusted pull-request trigger exists, and the six existing deployment secret names remain unchanged. Recommended owner-only guards for secret-bearing jobs and current immutable Action pins.
- 2026-07-12 lead: hardened all workflows with explicit read-only permissions, immutable current Action commits, non-persistent checkout credentials, owner-only secret-bearing jobs, pinned release dependencies, and bounded concurrency. Removed public signing diagnostics and moved temporary signing material out of the checkout with always-run cleanup.
- 2026-07-12 backend audit: verified the current TestFlight diff preserves signing and cleanup behavior. Tightened privileged-job guards to require both the original actor and any re-run triggering actor to be the repository owner.
- 2026-07-12 plumber audit: verified ignored databases and generated portraits are absent from Git history, scanned 806 tracked DIP cache files without sensitive findings, and confirmed the corrected relative schema imports load under `tsx`. Added the exact DIP source label and per-file credits for 13 Commons portraits embedded in App Store screenshots.
- 2026-07-12 lead: extended public TestFlight verification from 30 to 90 minutes within a 150-minute job because the preceding successful build 31 upload was processed and distributed but Apple's external state had not reached `IN_BETA_TESTING` within the old polling window.
- 2026-07-12 visibility audit: confirmed GitHub visibility does not affect the Cloudflare-hosted production site, canonicals, crawler policy, sitemap, or development noindex behavior. Added the missing public landing page, security policy, contribution guide, rights notice, and canonical project contacts.
- 2026-07-12 lead: local gates passed for 171 bilingual localization entries, 232 website-to-native settings fields, More UI structure, Python compilation, JavaScript syntax, corrected ETL module loading, Bundestag TypeScript, Actionlint 1.7.12, local Markdown links, current-tree Gitleaks, and the full Bundestag production build. Zizmor 1.26.1 reports zero medium or high findings; its two remaining low findings are the intentionally version-pinned Fastlane installations. Ruby and Xcode are unavailable on this Linux host and remain mandatory public macOS workflow gates before deployment.
