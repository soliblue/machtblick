# Machtblick

Machtblick makes public German political data easier to understand. It combines official parliamentary records with a web app and a native iOS app focused on Bundestag votes, members, parties, motions, and speeches.

- Website: [machtblick.de](https://machtblick.de)
- TestFlight: [Join the Machtblick beta](https://testflight.apple.com/join/r7RVrgtr)
- Data methodology: [machtblick.de/methodology](https://machtblick.de/methodology/)

## Repository map

- `apps/bundestag`: React and TanStack web application
- `apps/ios`: native SwiftUI application
- `db`: Drizzle schema, migrations, and reproducible normalization
- `etl`: importers for Bundestag Open Data, DIP, abgeordnetenwatch.de, Wikidata, and Wikimedia Commons
- `plans`: durable implementation records and decisions

Each app is self-contained and uses shared root packages. Apps never import from another app.

## Data and AI

Machtblick uses public sources from the German Bundestag, DIP, abgeordnetenwatch.de, Wikidata, and Wikimedia Commons. Source links and image attribution are retained in the product.

Some simplified titles, summaries, classifications, and translations are generated with AI from official documents. These fields can contain errors. The linked original parliamentary document remains authoritative.

The generated database, downloaded source material, member portraits, and prerendered output are intentionally not committed. A source checkout alone does not contain the current production dataset.

## Development

Install the root workspace with Node.js 22 or later:

```sh
npm install
```

Run the Bundestag app after providing the local generated database and assets:

```sh
npm run dev -w @machtblick/bundestag
```

Open `apps/ios/iOS.xcodeproj` in the Xcode version used by the checked-in iOS workflow to build the native app.

Never commit `.env` files, generated databases, signing certificates, provisioning profiles, App Store Connect keys, or downloaded portrait files.

## Security and contributions

Use [SECURITY.md](SECURITY.md) for vulnerability reports and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## Rights and attribution

No top-level open source license has been granted for the Machtblick source code. Public availability permits inspection and GitHub's standard fork functionality, but does not grant broader rights to reproduce, distribute, or create derivative works.

Third-party data, documents, fonts, images, and marks retain their own terms. See [NOTICE.md](NOTICE.md).
