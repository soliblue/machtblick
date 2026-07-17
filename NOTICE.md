# Third-party notices

This file describes material used by Machtblick that is not covered by any future license grant for the project's own source code.

## German Bundestag and DIP

Machtblick processes public parliamentary records, including roll-call lists, member master data, plenary records, parliamentary papers, and DIP metadata.

The German Bundestag states that parliamentary papers and plenary records are official works under section 5 of the German Copyright Act. Source attribution and the statutory prohibition on alteration continue to apply. Other Bundestag material can have different terms.

The 806 tracked DIP API responses under `etl/bundestag/handzeichen/drucksachen/` are retained as received and redistributed with the required source label: Deutscher Bundestag/Bundesrat &ndash; DIP. Machtblick-derived titles, summaries, translations, and classifications are identified in the product as processed or AI-derived material.

- [Bundestag Open Data](https://www.bundestag.de/services/opendata)
- [Bundestag legal notice](https://www.bundestag.de/services/impressum)
- [DIP terms of use](https://dip.bundestag.de/documents/nutzungsbedingungen_dip.pdf)

The DIP API identifier embedded in the source is published by the Bundestag in its public API documentation. It is not a private credential.

## abgeordnetenwatch.de

Machtblick uses public API data from [abgeordnetenwatch.de](https://www.abgeordnetenwatch.de/). API responses carry their own license metadata. Source references are retained in the data pipeline and product.

Portrait files are mirrored only when reusable author, license, and source metadata exists. Other approved portrait URLs remain remote display fallbacks and are not redistributed by Machtblick.

## Wikidata and Wikimedia Commons

Wikidata identifiers and portrait references are used to locate member portraits. Generated portrait binaries are ignored, except for portraits embedded in the tracked App Store screenshots. The generated portrait manifest retains Commons author, source URL, and per-file license metadata where Commons is the source. Portraits embedded in tracked screenshots are credited in [`fastlane/SCREENSHOT-CREDITS.md`](fastlane/SCREENSHOT-CREDITS.md).

- [Wikidata](https://www.wikidata.org/)
- [Wikimedia Commons](https://commons.wikimedia.org/)

## Fonts

The web and iOS apps include Fraunces and Lora under the SIL Open Font License 1.1. Their license texts are stored beside the iOS font files:

- `apps/ios/src/Fonts/OFL.txt`
- `apps/ios/src/Fonts/Lora-OFL.txt`

## Names, logos, and marks

Political party logos and names can be protected by trademark or other law. Their inclusion for identification and reporting does not grant permission for unrelated use.

The Machtblick name, logo, and product artwork are not included in any third-party license described here.

## IndexNow

The IndexNow key embedded in the site and ping script is a public ownership-verification value that must be retrievable from the production host. It is not an authentication secret.
