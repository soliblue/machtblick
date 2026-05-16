# Email routing

## Goal

Forward public Impressum mailboxes to `asoliman96@gmail.com`.

## Status

Done.

## Scope

- `hello@machtblick.de`
- `feedback@machtblick.de`
- `mitmachen@machtblick.de`

## Result

Cloudflare Email Routing is enabled for `machtblick.de`.

Destination `asoliman96@gmail.com` is verified.

Rules forward the three Impressum addresses to the destination.

DNS uses Cloudflare routing MX records and SPF:

- `route1.mx.cloudflare.net`
- `route2.mx.cloudflare.net`
- `route3.mx.cloudflare.net`
- `v=spf1 include:_spf.mx.cloudflare.net ~all`

Catch-all stays disabled.

## Log

- lead: Added and verified destination address.
- lead: Created forwarding rules for the three Impressum addresses.
- lead: Removed the previous `mx.plingest.com` MX record.
- lead: Enabled Cloudflare Email Routing.
- lead: Confirmed Cloudflare reports routing as ready and public resolvers return Cloudflare MX records.
