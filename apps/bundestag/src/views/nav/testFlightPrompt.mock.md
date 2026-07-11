# iPhone TestFlight prompt

## Route

Sitewide modal, rendered after hydration only on the first visit from Safari on iPhone. It never appears in prerendered HTML, desktop browsers, or non-Safari iPhone browsers.

## Layout

```
+--------------------------------------+
| dimmed page                          |
|                                      |
|  +--------------------------------+  |
|  | [app]                      [x] |  |
|  |                                |  |
|  | Machtblick fürs iPhone         |  |
|  | Teste die Machtblick App       |  |
|  | vorab mit TestFlight.          |  |
|  |                                |  |
|  | [ In TestFlight öffnen       ] |  |
|  | [ Nicht jetzt                ] |  |
|  +--------------------------------+  |
+--------------------------------------+
```

The sheet is anchored above the bottom safe area with `l` radius, a restrained backdrop, and a maximum width of 360px. It does not change nav, page, or scroll-snap geometry.

## Behavior

- Set `machtblick.testFlightPrompt.seen` in local storage when the modal first appears, not only when dismissed.
- The modal therefore appears once per Safari profile. Clearing website data or using a private profile can show it again.
- Primary action opens `https://testflight.apple.com/join/r7RVrgtr` in the current browsing context so iOS can hand off to TestFlight.
- Close icon, backdrop, Escape, and `Nicht jetzt` / `Not now` dismiss the modal.
- Use Radix Dialog for focus containment, restoration, accessible title and description, backdrop dismissal, and Escape handling.

## Copy

| Locale | Title | Description | Primary | Secondary |
|---|---|---|---|---|
| de | Machtblick fürs iPhone | Teste die Machtblick App vorab mit TestFlight. | In TestFlight öffnen | Nicht jetzt |
| en | Machtblick for iPhone | Try the Machtblick app early with TestFlight. | Open in TestFlight | Not now |
