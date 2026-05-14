# Footer (sitewide)

Lives in `apps/bundestag/src/views/nav/Footer.tsx`, rendered once in `__root.tsx` after the `<Outlet />` -- inside the body, outside the page container. The `nav/` view already owns sitewide chrome (`ScrollEyeWordmark`), so the footer belongs here rather than in a new `_layout/` view.

## Layout

```
... page content ends ...

+============================================================+   <- top border: text @ opacity-s
|                                                            |
|  Machtblick -- Daten aus oeffentlichen Quellen             |
|                              Impressum    Datenschutz      |
|                                                            |
+============================================================+
```

Inside the existing `max-w-3xl` `px-l` container, mirroring the nav. Two-column flex row, tagline left, links right (`ml-auto`). Single line on desktop and tablet.

### Mobile (< sm)

```
+============================================================+
|                                                            |
|  Machtblick -- Daten aus oeffentlichen Quellen             |
|                                                            |
|  Impressum    Datenschutz                                  |
|                                                            |
+============================================================+
```

Stack vertically below `sm`, tagline on top, links below.

## Notes

- One top border, `1px solid color-mix(in oklab, var(--color-fg) 15%, transparent)` -- matches the nav's bottom border so the page is visually bracketed by identical hairlines.
- No background fill. Footer sits on `var(--color-background)` like the rest of the app. The shade-change idea was tempting but adds a horizontal seam we don't need.
- Tagline is `text-s opacity-l`. Quiet by design.
- Two links, same size and weight as the tagline. Active state (matching route) gets `opacity-100` like the nav links, so a user on `/impressum` sees that link as the bold one in the row.
- No "(C) Machtblick" line. No year. No version. No social icons. No "Built with X" credit. No language switcher. The footer is a legal-link rail, not a navigation surface -- the nav already does navigation.
- Spacing: `py-l` (16) top and bottom inside the container. `gap-l` (16) between Impressum and Datenschutz. `mt-xl` (24) outside the container to separate from page content.
- Footer must render on every route, including `/impressum` and `/datenschutz` themselves. The links self-reference; that's fine and expected.

## Filters / interactions

- Two links: `/impressum`, `/datenschutz`. TanStack Router `<Link>`, same `[&.active]` styling as the nav so the current legal page is highlighted.
- Hover state: `opacity-100` (links default to `opacity-l`).
- No JS state. Footer is fully static markup.

## Emphasis

The footer should be near-invisible until a reader looks for it. The legal links must be findable on every route without competing with content. If a designer feels tempted to make the footer "more useful" by adding nav links, sitemaps, or credits -- resist.

## Tokens

| Element | Text size | Weight | Spacing | Component |
|---|---|---|---|---|
| Footer container | -- | -- | py-l, mt-xl, border-top text @ opacity-s | -- |
| Inner container | -- | -- | max-w-3xl, px-l, flex, items-center | -- |
| Tagline | s | regular | opacity-l | -- |
| Link group | -- | -- | ml-auto, flex, gap-l | -- |
| Link | s | regular | opacity-l, hover opacity-100, [&.active] opacity-100 | -- (TanStack Link) |

Components used: none. Plain semantic `<footer>` with two `<Link>`s.

## Placement in __root.tsx

```
<body>
  <QueryClientProvider ...>
    <TooltipProvider ...>
      <StampFilter />
      <Nav />
      <Outlet />
      <Footer />     <-- here, last child inside the providers
    </TooltipProvider>
  </QueryClientProvider>
  <Scripts />
</body>
```
