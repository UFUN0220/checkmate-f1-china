# UFun integration plan

Stage 3N records the verified architecture boundary for bringing the
Checkmate feature into `F:\projects_2027\ufun`. It is a migration plan, not a
deployment plan and not permission to access Checkee.

## Decision summary

UFun is the host. It owns the root layout, Header, Footer, page route,
background, outer container and any URL navigation. Checkmate contributes only
the two feature modules, their safe snapshot types and runtime analytics, the
two reviewed static snapshots, feature-scoped CSS, and the already available
`HYBlackMythU` font.

Stage 3N deliberately does **not** create a UFun preview page. The UFun working
tree is actively changing its Home, Header and global Tailwind CSS, including
files that determine the exact host integration boundary. Adding a preview
route now would couple the feature to unrelated uncommitted work and would make
the required isolated UFun commit unsafe. The planned preview route is
`/checkmate-preview`, which is not linked from `HEADER_NAV_LINKS`; it can be
added when that working tree is stable.

## Verified UFun architecture

| Area                | Verified state                                                                                                                                         | Integration implication                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework           | Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3                                                                                                        | App Router integration is compatible with the Checkmate client features. Checkmate is Next 16.3.2, React 19.2.8 and TypeScript 5.9.3, so source trees and lockfiles must remain separate.                                                  |
| Routing             | `app/` file routes: `/`, `/blog`, `/about`, `/tags`, catch-all blog routes and route handlers                                                          | Create a self-contained `app/checkmate-preview/page.tsx` only when the host tree is ready. Do not add the two Checkmate views to the global header.                                                                                        |
| Root page structure | `app/layout.tsx` renders `Header`, `main`, and `Footer`                                                                                                | The preview page is rendered inside host `main`. It must not render `EvidenceAtlas` or `CheckmateNavigation`.                                                                                                                              |
| Navigation          | `data/navigation.ts` is the owner of `HEADER_NAV_LINKS`                                                                                                | No Stage 3N navigation change. A future feature-local tab control lives inside the preview experience, not in `HEADER_NAV_LINKS`.                                                                                                          |
| Styling             | Tailwind v4 entry `css/tailwind.css`; host theme tokens include `--color-paper`, `--color-surface`, `--color-line`, `--color-ink` and `--color-accent` | A host wrapper maps only `--checkmate-*` tokens. No Checkmate visual redesign is part of this stage.                                                                                                                                       |
| Layout              | `Container` uses `max-w-6xl` with responsive horizontal padding                                                                                        | Host controls outer width/gutters. Checkmate controls grids, lists and tables within the feature wrapper.                                                                                                                                  |
| Static assets       | `public/static/**`, `public/fonts/**` and static imported data                                                                                         | Copy reviewed snapshots into a host-private source data module for static import; do not expose raw inputs. Assets which must be browser-visible use UFun's `public/` convention.                                                          |
| Base path           | `next.config.js` sets `basePath` from `BASE_PATH`; the root layout already prefixes public asset URLs                                                  | Static JSON module imports avoid runtime asset paths entirely. A future feature-local font URL must use the host base-path helper or the existing host font rule.                                                                          |
| Font                | `public/fonts/HYBlackMythU.woff2` exists and UFun has a `heishenhua` font family convention                                                            | Reuse that host asset and family. Do not copy the font again or let Checkmate inject a second `@font-face`.                                                                                                                                |
| Data loading        | Server components import Contentlayer/static data; browser islands are explicit client components                                                      | Load snapshots in a server route/page and pass typed data to a client Checkmate composition component, or use a static JSON module inside that client boundary. No fetch to Checkee, API route, raw file or sibling repository is allowed. |

## Checkmate feature boundary

The integration entry points remain:

```tsx
import { HallOfFame, WhiteHouseSelection } from "@/components/checkmate";
```

`WhiteHouseSelection` owns the five-city metrics, city selection, descending
Check Date detail list and ten-row pagination. It can be controlled by a host
via `selectedCity` and `onSelectedCityChange`; it does not read or write URL
state. `HallOfFame` owns the frozen 97-case metrics, expanding its case list,
ascending order and ten-row pagination. Neither module mounts the standalone
header, footer, methodology block or Checkmate URL state.

`EvidenceAtlas` and `CheckmateNavigation` remain standalone-only. They read and
write `view`/`city` with browser globals and must never be imported into UFun's
feature route.

The safe loader boundary is already build-time static import:

```ts
loadCheckeeSnapshot(); // 503 reviewed Page1 public cases
loadPage2Snapshot(); // 97 reviewed Page2 public cases
```

It has no browser `fetch`, absolute `/data/...` path, source-repository path or
browser-global dependency. For UFun, Option B is therefore selected: copy the
two reviewed JSON files as an explicit release input to a UFun source module
(for example `data/checkmate/`) and import them at build time. This works with
UFun's `BASE_PATH`, static export and CSP without a separate data URL adapter.
The UFun runtime must not import from `F:\projects_2027\checkmate`.

## Data and privacy contract

The frozen input is exactly the 2026-09-01 snapshot:

| Dataset | Runtime artifact                           | Frozen count |
| ------- | ------------------------------------------ | -----------: |
| Page1   | `public/data/checkee-static-snapshot.json` |          503 |
| Page2   | `public/data/page2-static-snapshot.json`   |           97 |

Only those reviewed public snapshots may be copied into UFun. The following
must remain in Checkmate's offline preparation boundary: raw HTML, XLSX,
parsers, adapters, internal normalized records, provenance, source IDs,
ingestion reports, private directories and validation artifacts. The host must
continue to display the static-snapshot/non-live source relationship. It must
not claim real-time data and must keep `CHECKEE_ACCESS_MODE=disabled`.

## CSS and asset strategy

The feature must sit below an explicit root, for example:

```tsx
<section className="site-container checkmate-host">
  <div className="checkmate-feature">...</div>
</section>
```

The host wrapper is the only place that maps theme values:

```css
.checkmate-host {
  --checkmate-paper: transparent;
  --checkmate-surface: var(--color-surface);
  --checkmate-surface-soft: color-mix(in srgb, var(--color-surface) 86%, var(--color-paper));
  --checkmate-ink: var(--color-ink);
  --checkmate-ink-soft: var(--color-ink-soft);
  --checkmate-muted: var(--color-muted);
  --checkmate-line: var(--color-line);
  --checkmate-accent: var(--color-accent);
}
```

The value of `--checkmate-paper` is intentionally not a page background: UFun
owns the ambient body background. The future extracted stylesheet must include
only `.checkmate-*` selectors and local descendant rules, not standalone
`.atlas-*` surfaces or `html`, `body`, `#root` or `#__next` rules.

Potential host-to-feature collisions are Tailwind Preflight's element defaults,
the global `*` border-color rule, typography defaults and the `body:has(...)`
rules used by UFun's home/about pages. The preview route avoids the latter two
route markers; Checkmate's existing `.checkmate-feature` element reset contains
the former controls. Potential feature-to-host collisions are the currently
co-located Checkmate global stylesheet and its root-level `@font-face`. The
future UFun import must use a feature-only stylesheet and the host's existing
font registration; no Checkmate global stylesheet is imported into
`app/layout.tsx`.

## Dependency compatibility

| Checkmate feature dependency | UFun status                                       | Decision                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`, `react`, `react-dom` | Present; matching major, differing patch versions | Keep repositories and lockfiles independent. Do not cross-import source.                                                                                                                  |
| `@phosphor-icons/react`      | Not present                                       | Do not add it during preparation. The future extracted host feature should replace its few icons with UFun's existing `lucide-react` or tiny local SVGs, after visual integration begins. |
| Tailwind                     | Present in both projects, host uses v4            | Do not depend on Checkmate's global Tailwind build. Carry scoped feature CSS as an explicit migration artifact.                                                                           |
| `HYBlackMythU.woff2`         | Already present in UFun                           | Reuse a single host copy.                                                                                                                                                                 |

Checkmate's parser, validation and import scripts are development-only, not
runtime dependencies. No additional UFun package is required for the selected
data strategy.

## Migration inventory

The current implementation keeps standalone and feature exports in
`components/evidence-atlas.tsx`, but their runtime boundary is already explicit.
The UFun migration must copy or extract only the following dependency closure;
it must not copy the entire Checkmate source tree.

| Classification      | Include in a future UFun `features/checkmate/` migration                                                                                                                 | Exclude                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Feature runtime     | `WhiteHouseSelection`, `HallOfFame`, their local rendering helpers, `lib/analytics/metrics.ts`, `lib/data/presentation.ts`, and the safe model/type definitions they use | `EvidenceAtlas`, `CheckmateNavigation`, standalone URL helpers and standalone footer/methodology UI                           |
| Safe runtime data   | The two reviewed snapshot JSON modules and their minimal type assertions                                                                                                 | `data/private/`, `data/manual/`, generated ingest reports, raw HTML, XLSX, provenance and source IDs                          |
| Styling/assets      | A newly extracted `.checkmate-*`-only stylesheet, host token wrapper, and the one host-owned black-myth font registration                                                | `app/globals.css` as a whole, standalone body/viewport rules, `.atlas-*` styles and duplicate font files                      |
| Development/offline | Nothing at UFun runtime                                                                                                                                                  | Checkee adapters, import/parsing/generation scripts, validation fixtures, audit reports and every data-preparation dependency |

This is intentionally an extraction boundary, not a direct sibling import. The
existing component file is not copied as-is because it also contains the
standalone shell and imports `@phosphor-icons/react`. The first UFun prototype
will introduce its own small runtime files from the selected feature exports,
replace the few icons with UFun's existing icon convention, and leave the
Checkmate standalone source untouched.

## Planned minimal prototype

Once UFun's current working tree is stable, create a separate UFun commit with
only:

1. `app/checkmate-preview/page.tsx`, a host-owned page route with metadata.
2. A client `features/checkmate/CheckmateExperience.tsx` that keeps local
   `cities|peers` state and renders the two Checkmate feature modules.
3. Copied reviewed JSON under a UFun source data module, and a feature-local
   stylesheet/token wrapper.
4. No `HEADER_NAV_LINKS` change, no `next.config.js` change and no global
   layout/blog/home change.

The URL adapter initially owns no query parameters. If UFun later needs a city
deep link, the wrapper may use `useSearchParams`, `useRouter` and
`usePathname` to update only `city`, preserving every other query parameter and
back/forward behavior. Checkmate itself remains URL-agnostic.

Required smoke checks are: both modules mount; all five cities select; Page1
and Page2 paginate at ten records; Page2 expands/collapses; font resolves once;
host header and blog remain unchanged; no horizontal overflow at 1440x1000 or
390x844. Run UFun's `typecheck` and `build` plus its non-mutating lint command
(the current `lint` script writes fixes, so it must not be used as a read-only
verification command).

## Final integration workflow

```text
Checkmate offline parser + PII/schema gates
  -> reviewed 2026-09-01 safe snapshots
  -> explicit manual copy to UFun source data module
  -> UFun build-time static import
  -> host-owned /checkmate-preview (then final project route)
```

Any future snapshot update repeats the Checkmate offline validation first. It
does not create a watcher, scheduled synchronization, background transfer or
network call from UFun.
