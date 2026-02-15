# KanjiVG Focus Viewer (Desktop Only)

This repository is intentionally limited to the Neutralino desktop app.
There is no Jekyll/static website build or alternate web entrypoint.

## Run

1. `npm install`
2. `npm run desktop:launch` (checks `desktop-dist/`, rebuilds if missing or stale, then runs)
3. `npm run desktop:dev` (always rebuilds before running)

## Build

1. `npm run desktop:build`

## Project Layout

- `desktop-viewer.html`: desktop entry page.
- `neutralino.config.json`: Neutralino window/app config.
- `scripts/build-desktop-dist.mjs`: copies runtime files into `desktop-dist/`.
- `css/`, `img/`, `js/`: UI/runtime assets used by the desktop page.
- `kanjivg/kanji/` and `kanjivg/kvg-index.json`: KanjiVG data used by the viewer.
