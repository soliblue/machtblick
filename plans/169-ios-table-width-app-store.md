# iOS table width App Store release

## Goal

Upload the verified result-table width fix and submit its build to App Review.

## Status

Complete. iOS 1.5 build 47 is submitted and WAITING_FOR_REVIEW, with automatic release after approval.

## Contracts

- Release the native UI verified in run 37298415604 on d25f15f.
- Read the live App Store state before choosing a version or cancelling review.
- Upload and verify the replacement build before withdrawing the earlier submission.
- Replace only Machtblick's matching iOS version and build 46 when it remains under review.
- Verify the new attached build is VALID, submitted, and set to release automatically with both localized notes.
- Preserve unrelated web, data, and workspace edits.

## Ownership

- Release explorer: read-only retrieval of the replacement API and workflow path.
- Root: release scripts, isolated branch, upload, submission, and verification.

## Log

- Root: user explicitly requested submission after the width fix passed native checks and screenshot review. Start from the verified width branch, with an isolated release checkout.
- Root: read-only inspection run 37301313575 confirmed iOS 1.5 still WAITING_FOR_REVIEW, attached build 46 VALID, and automatic release AFTER_APPROVAL. Keep version 1.5 and upload its next build with the width fix and updated German/English notes.
- Root: upload run 37301644213 succeeded on a2d846f, with iOS 1.5 build 47 processed VALID. App source is identical to the native-verified d25f15f; only release notes and tooling changed.
- Release worker: exact version/build/review-item checks, a fresh pre-cancellation read, and a 600-second deadline protect replacement. Ten mocked tests pass, covering mismatch/race cases, pagination, HTTP errors, safe resume, and READY_FOR_REVIEW/COMPLETE polling outcomes. Only DEVELOPER_REJECTED on the exact earlier version/build permits resubmission.
- Root: submission run 37302647451 succeeded on bff7c6f. Exact build 46 was removed from review and reached DEVELOPER_REJECTED before replacement. Apple verified 1.5 build 47 VALID and WAITING_FOR_REVIEW at 11:24 UTC on 2026-10-05, with AFTER_APPROVAL release and the updated German/English notes. The submitted binary includes the native-verified full-width table fix.
