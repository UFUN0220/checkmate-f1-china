# Design QA · Evidence Atlas

## Source visual truth

- Source: `D:\codex\codex-home\generated_images\01a02904-4a79-7192-b655-57da4f38cfe3\exec-cb12c933-a2ee-4fc7-bd92-131c6db45ccd.png`
- Source pixels: 1487 × 1058.
- Source state: Evidence Atlas / national overview / Guangzhou highlighted.

## Rendered implementation evidence

- Desktop screenshot: `F:\projects_2027\checkmate\desktop-evidence-atlas-viewport.png`
- Mobile screenshot: `F:\projects_2027\checkmate\mobile-evidence-atlas.png`
- Combined comparison: `F:\projects_2027\checkmate\design-qa-comparison.png`
- Desktop viewport: 1440 × 1000 CSS px; captured implementation pixels: 1425 × 990; browser density normalized at 1×.
- Mobile viewport: 390 × 844 CSS px; captured implementation pixels: 375 × 812 because the browser reserves scrollbar space; browser density normalized at 1×.
- Comparison input: source and final desktop implementation were placed side-by-side in `design-qa-comparison.png`; the mobile implementation was reviewed separately for responsive behavior.

## Interaction and runtime checks

- National overview renders with the selected Guangzhou state and enabled CTAs.
- Selecting Guangzhou and entering location metrics produces `/?location=guangzhou&view=location`.
- Opening cases produces `/?location=guangzhou&view=cases` and the verified-public empty state.
- A clean browser session reported no console errors after the hydration fix.
- Mobile layout stacks the sidebar and content; the route and table retain intentional inner horizontal scrolling for dense data.

## Fidelity review

- Fonts and typography: serif display hierarchy, compact sans metadata, Chinese line-height, and title scale follow the source direction. The implementation uses system Songti/Georgia fallbacks because no source font file was provided.
- Spacing and layout rhythm: dark masthead, narrow left rail, generous content gutter, horizontal evidence route, and ruled table sections are preserved. The implementation uses a responsive stacked layout below 900 px.
- Colors and tokens: ink navy, warm paper, muted blue, teal route markers, and ochre selected state are implemented as shared CSS tokens.
- Image quality and asset fidelity: the faint mainland China map texture is a project-bound raster asset at `F:\projects_2027\checkmate\public\assets\evidence-atlas-map.png`; Phosphor provides the interface icons. No invented SVG illustration replaces the map asset.
- Copy and content: known baseline values remain 80 total, Check 76, Approve 4, with Guangzhou 32, Beijing 25, Shenyang 13, Wuhan 7, Shanghai 3. Unknown per-location state and waiting-age fields remain explicitly pending rather than being inferred from the source sheet.

## Comparison history

1. Initial comparison found two P2 visual differences: the overview opened without the source's selected Guangzhou state, and the map texture was too faint. Fixed by defaulting the client-resolved overview to Guangzhou, adding the national 80 node, and increasing map texture opacity. Final evidence: `design-qa-comparison.png`.
2. The first browser render found a hydration mismatch caused by resolving URL state during render. Fixed by synchronizing URL state in `useEffect`. A clean browser session then reported zero console errors.
3. Mobile review found wide map/table content. This is contained in intentional inner scroll regions; persistent page controls remain visible and the final mobile screenshot shows the stacked responsive composition without a visible page-level horizontal scrollbar.

## Findings

- No actionable P0, P1, or P2 findings remain for the selected overview state.
- P3 follow-up: provide a final production map asset with the source's exact province-line contrast if one becomes available; the current generated texture is intentionally subdued to avoid competing with the evidence route.

## Implementation checklist

- [x] Match the selected Evidence Atlas composition.
- [x] Keep the visible data boundary honest.
- [x] Verify desktop and mobile rendering.
- [x] Verify location and cases navigation.
- [x] Check console errors after hydration fix.
- [x] Run formatting, lint, typecheck, tests, and production build.

final result: passed
