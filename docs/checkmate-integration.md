# Checkmate integration guide

Stage 3M defines the boundary between the Checkmate product surface and a host
site. The host may embed the two feature modules without adopting Checkmate's
standalone navigation, URL state, footer, body reset, or viewport background.

## Public entry points

```tsx
import { HallOfFame, WhiteHouseSelection } from "@/components/checkmate";

<WhiteHouseSelection />
<HallOfFame />
```

`WhiteHouseSelection` renders the Page1 title, five-location metrics, trend,
and optional city detail. `HallOfFame` renders the Page2 title, 97-case
metrics, quartiles, and local case-list expansion/pagination.

Both modules render without `window`, `document`, `history`, or URL query
state. Page1 accepts `initialCity`, an optional controlled `selectedCity`, an
optional `onSelectedCityChange`, and an injectable safe `data` snapshot.
Page2 accepts an injectable safe `data` snapshot. These props are intended for
the host's composition layer; they do not change the data contract.

`EvidenceAtlas` is the standalone shell. It owns the Checkmate brand,
navigation, URL state (`view=cities|peers`, legacy aliases, and `city`),
methodology section, footer, and viewport presentation. `CheckmateNavigation`
is also exported for shell implementations that need the navigation alone.

## Data and assets

Runtime presentation crosses the data boundary through:

- `loadCheckeeSnapshot()` → generated `public/data/checkee-static-snapshot.json`
- `loadPage2Snapshot()` → generated `public/data/page2-static-snapshot.json`

The feature components never import raw HTML, private records, or
`data/raw/page2.xlsx`. Raw/source preparation remains offline and build-time;
the host should copy or import only the generated safe JSON artifacts. The
existing production font is `public/fonts/HYBlackMythU.woff2`, loaded by the
Checkmate stylesheet for the page headers with a normal fallback available.

## CSS boundary

Use the feature module inside a host-owned wrapper and override the
`--checkmate-*` tokens there when desired:

```css
.personal-site-checkmate {
  --checkmate-surface: #101114;
  --checkmate-ink: #f5f5f7;
  --checkmate-line: rgba(255, 255, 255, 0.16);
}
```

The standalone shell owns the body class, viewport background, and body-level
overflow reset. `.checkmate-feature` owns only feature tokens and content
layout. The stylesheet no longer applies custom Checkmate rules through bare
`body`, `button`, `a`, `html`, or universal selectors; the remaining legacy
`.atlas-*` rules are class selectors for historical, unmounted surfaces and
are not part of the integration API. A future host migration can remove those
legacy blocks after visual parity is no longer needed.

The feature surface still expects the existing Checkmate stylesheet to be
loaded. If the host extracts the modules, migrate the `.checkmate-*` rules and
the font asset together, or provide equivalent host CSS and token aliases.

## Operational boundary

The current snapshots remain offline and are not a claim of live data. The
source status is `CHECKEE_ACCESS_BLOCKED`; no browser request, cookie, proxy,
scheduled fetch, or Checkee HTML parser is enabled by this integration work.
`DEMO_DATA` and static snapshot/source notices must remain visible wherever
the corresponding dataset is presented. The public field boundary and PII
suppression rules remain unchanged.
