# iPhone App Store prompt

## Route

Sitewide modal, rendered after hydration only on the first visit from a non-Safari browser on iPhone. It never appears in prerendered HTML, desktop browsers, or Safari on iPhone, where the native Smart App Banner is available instead.

## Layout

```
+--------------------------------------+
| dimmed page                          |
|                                      |
|  +--------------------------------+  |
|  | [app]                      [x] |  |
|  |                                |  |
|  | Machtblick fürs iPhone         |  |
|  | Die Machtblick App ist jetzt   |  |
|  | im App Store.                  |  |
|  |                                |  |
|  | [ Im App Store laden         ] |  |
|  | [ Nicht jetzt                ] |  |
|  +--------------------------------+  |
+--------------------------------------+
```

The sheet is anchored above the bottom safe area with `l` radius, a restrained backdrop, and a maximum width of 360px. It does not change nav, page, or scroll-snap geometry.

## Behavior

- Set `machtblick.appStorePrompt.seen` in local storage when the modal first appears, not only when dismissed.
- The modal therefore appears once per non-Safari browser profile. Clearing website data or using a private profile can show it again. Visitors who dismissed the earlier TestFlight prompt see the launch announcement once, because the storage key changed with the App Store release.
- Primary action opens `https://apps.apple.com/us/app/machtblick/id6787755187` in the current browsing context so iOS can hand off to the App Store.
- Close icon, backdrop, Escape, and `Nicht jetzt` / `Not now` dismiss the modal.
- Use Radix Dialog for focus containment, restoration, accessible title and description, backdrop dismissal, and Escape handling.

## Copy

| Locale | Title | Description | Primary | Secondary |
|---|---|---|---|---|
| de | Machtblick fürs iPhone | Die Machtblick App ist jetzt im App Store. | Im App Store laden | Nicht jetzt |
| en | Machtblick for iPhone | The Machtblick app is now on the App Store. | Get it on the App Store | Not now |
