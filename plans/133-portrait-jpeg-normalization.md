# Portrait JPEG normalization

## Goal

Make the checked-in Bundestag portrait pipeline decode every source image and publish every member portrait as a real JPEG at `/members-photos/<member-id>.jpg`, then regenerate and deploy the production assets and manifest.

## Status

- Lead: complete
- Plumber: complete
- Visibility: complete
- Tester: complete
- Deployer: complete
- Scribe: complete

## Scope

- Portrait download and import pipeline
- Generated portrait files and manifest
- Generated member `pictureUrl` values
- Production portrait asset deployment
- Production verification for the member grid and detail pages

## Contracts

- Every downloaded source image is decoded before output.
- Every output is an actual JPEG, independent of source format.
- Transparent source pixels are composited safely before JPEG encoding.
- Every portrait path is `/members-photos/<member-id>.jpg`.
- Every manifest `file` value and generated member `pictureUrl` ends in `.jpg`.
- Author, licence, and source URL metadata remain byte-for-byte unchanged.
- Repeated runs produce the same extension and cannot recreate PNG outputs.
- The iOS app and unrelated data remain unchanged.

## Affected members

- `aeikens-anna`
- `biadacz-marc`
- `luczak-jan-marco`
- `mayer-andreas`
- `minich-sergej`
- `piechotta-paula`
- `rouenhoff-stefan`
- `schreiner-felix`
- `vollath-sarah`

## Verification

- Pipeline tests prove PNG input becomes a valid JPEG and transparency is handled.
- Generated manifest contains only `.jpg` files.
- Every manifest reference returns HTTP 200 in production.
- Each affected member renders a portrait in the production member grid and detail page.
- Production deployment reports success.

## Open questions

- None.

## Log

- 2026-07-13 Lead: Fast-forwarded `main` from `cdb9c47` to `b02af21` and created this focused plan before implementation.
- 2026-07-13 Plumber: Updated `apps/bundestag/scripts/fetch-member-photos.mjs` so new downloads and legacy non-JPEG cache entries pass through Sharp decoding, orientation, width normalization, white transparency compositing, and JPEG encoding before being written as `<member-id>.jpg`. Manifest files are now constructed from the canonical JPEG path, and every residual PNG in the portrait output directory is removed before the build copies assets.
- 2026-07-13 Plumber: Added `member-photo-jpeg.mjs`, a transparent-PNG test, and the test gate to the Bundestag build. The first local refresh converted all 9 affected portraits, a second refresh reported 376 cached JPEGs and 0 conversions, and the attribution metadata SHA-256 stayed `6e8a9662238f83803d95fc2d6525982a7d547ad98dc0a854f85fab9c1cc13b99` before and after.
- 2026-07-13 Plumber: `npm --workspace @machtblick/bundestag run build` passed. Post-build validation found 376 manifest entries, 376 matching JPEG files with JPEG bytes, 0 PNG assets, all 752 local portrait URLs across both locales ending in `.jpg`, no generated PNG portrait references, and the 9 affected member JSON files in both locales using their canonical URL.
- 2026-07-13 Visibility: PASS. The diff from `b02af21` changes only the portrait pipeline and build gate, so HTML metadata, sharing previews, crawler access, AI discovery, favicons, the web manifest, sitemap, and unrelated JSON alternates are SKIP as unaffected. The lead-provided production build is newer than the changed pipeline and was not rebuilt. Its portrait manifest has 376 entries, all ending in `.jpg`, every referenced file exists, the output has 0 PNG portraits, and every emitted JPG has JPEG magic bytes.
- 2026-07-13 Visibility: PASS. The canonical German and English Anna Aeikens member vote pages both contain the expected `/members-photos/aeikens-anna.jpg` image with matching alt text, contain no PNG reference, and retain absolute self-canonicals plus reciprocal `de`, `en`, and `x-default` alternates. Their JSON alternates exist, and both localized member JSON files use the same canonical JPG URL. Blocking issues: none.
- 2026-07-13 Tester: PASS. Headless Chromium with iPhone 13 emulation rendered all 9 affected portraits in the searchable member grid and each `/members/<id>/votes/` detail route. Every image used the exact canonical JPG path, decoded with a positive natural width, and returned HTTP 200. The clean run had 0 console errors, 0 page errors, and 0 failed requests.
- 2026-07-13 Lead: Confirmed the requested production path is the existing Cloudflare Pages project `machtblick-bundestag`, gated by the completed visibility review.
- 2026-07-13 Scribe: Committed and pushed the focused pipeline change as `3b1319d` (`fix(web): normalize member portraits as jpeg`).
- 2026-07-13 Deployer: Built from the pushed commit and deployed 11,160 files to `https://089b5dc4.machtblick-bundestag.pages.dev`. Cloudflare Pages usage is 18 of 500 deployments for 2026-07.
- 2026-07-13 Lead: Production verification found 376 of 376 manifest paths ending in `.jpg`, 376 of 376 references returning HTTP 200 with `image/jpeg` and JPEG magic bytes, 18 of 18 affected localized member JSON files using canonical JPG paths, and the unchanged attribution metadata SHA-256 `6e8a9662238f83803d95fc2d6525982a7d547ad98dc0a854f85fab9c1cc13b99`.
- 2026-07-13 Tester: PASS on production. All 9 affected members rendered visible, decoded JPG portraits in both the searchable grid and detail route. The run had 0 console errors, 0 page errors, and 0 failed requests.
- 2026-07-13 Deployer: The immutable deployment has no PNG portrait assets. The custom domain still serves the 9 retired, unreferenced PNG URLs from CDN cache. A targeted purge was blocked by Cloudflare HTTP 401 error 10000 because the configured token lacks zone cache-purge authorization; all replacement JPG URLs are live and referenced.
