# Footer

The shared footer is rendered after the route content on every German and English page.

## German

```text
... page content ends ...

+============================================================+
|  Anträge  Reden  Daten  Code  Impressum  Datenschutz     |
+============================================================+
```

## English

```text
... page content ends ...

+============================================================+
|  Motions  Speeches  Data  Code  Imprint  Privacy           |
+============================================================+
```

The links sit in one right-aligned wrapping flex row inside the existing `max-w-3xl` and `px-l` container. They remain a single line when space permits and wrap naturally at narrower widths without horizontal scrolling.

## Links

- Anträge or Motions: locale-aware `/motions/`
- Reden or Speeches: locale-aware `/speeches/`
- Daten or Data: locale-aware `/methodology/`
- Code: `https://github.com/soliblue/machtblick`, opened in a new tab with `noreferrer`
- Impressum or Imprint: locale-aware `/imprint/`
- Datenschutz or Privacy: locale-aware `/privacy/`

Only the source-code link is external. It stays a plain text link without an icon so the footer remains visually quiet.

## Tokens

- Footer separation uses `mt-xl` and a top border of foreground at opacity `s`.
- The inner row uses `gap-l`, `px-l`, `py-l`, and text size `s`.
- Links use opacity `l`, full opacity on hover, and the existing active-route emphasis for internal destinations.
