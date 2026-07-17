# Machtblick

Machtblick makes public German political data easier to understand. It combines official parliamentary records with a web app and a native iOS app focused on Bundestag votes, members, parties, motions, and speeches.

- Website: [machtblick.de](https://machtblick.de)
- iOS app: [Machtblick on the App Store](https://apps.apple.com/us/app/machtblick/id6787755187)
- Data methodology: [machtblick.de/methodology](https://machtblick.de/methodology/)

## Repository map

- `apps/bundestag`: React and TanStack web application
- `apps/ios`: native SwiftUI application
- `db`: Drizzle schema, migrations, and reproducible normalization
- `etl`: importers for Bundestag Open Data, DIP, abgeordnetenwatch.de, Wikidata, and Wikimedia Commons
- `plans`: implementation records and decisions

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

Local development needs no `.env` file (`.env.example` documents the optional deploy, data, and iOS variables). The app reads a generated SQLite database at `db/machtblick.sqlite`; see [db/README.md](db/README.md) for how to get one.

Run the Bundestag app after providing the local generated database:

```sh
npm run dev -w @machtblick/bundestag
```

Open `apps/ios/iOS.xcodeproj` in the Xcode version used by the checked-in iOS workflow to build the native app; see [apps/ios/README.md](apps/ios/README.md).

Never commit `.env` files, generated databases, signing certificates, provisioning profiles, App Store Connect keys, or downloaded portrait files.

## Scheduled data refresh

A weekly systemd timer (unit templates in `scripts/systemd/`) starts an operator-run agent session that follows the runbook in `prompts/auto-refresh.md`: it checks upstream Bundestag data, runs the needed ETL and derived refreshes in their required order, verifies the result, and deploys only when every gate passes. It is not needed for local development.

## Security and contributions

Use [SECURITY.md](SECURITY.md) for vulnerability reports and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## Rights and attribution

The Machtblick source code is licensed under the GNU Affero General Public License v3.0, see [LICENSE](LICENSE). You may use, modify, and self-host it; derivative works and network-hosted deployments must remain open under the same terms.

Third-party data, documents, fonts, images, and marks retain their own terms. See [NOTICE.md](NOTICE.md).
