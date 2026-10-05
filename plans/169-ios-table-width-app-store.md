# iOS table width App Store release

## Goal

Upload the verified result-table width fix and submit its build to App Review.

## Status

Checking the live App Store version before uploading and replacing the earlier build.

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
