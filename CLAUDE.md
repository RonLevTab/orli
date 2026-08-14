# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing site for **Orli**, an online-booking add-on for clinics running
the legacy **Optima** scheduling system. Plain static HTML/CSS/JS — no build step, no
package manager, no dependencies, no tests.

## Related project

This is the landing page for **`orli-calendar`** (sibling repo, checked out
alongside this one), the actual booking product (FastAPI + Vue widget). Keep
the two aligned when shipping features:

- `widget.js` here is a hand-maintained vanilla-JS mirror of the real Vue widget at
  `orli-calendar/widget/src/App.vue` + its step components — when the real widget's
  booking flow, steps, or copy change, update this mock to match.
- Bilingual strings in `widget.js`'s `S` table mirror `orli-calendar/widget/src/i18n.ts`.
- If a feature changes what the product can actually do (new booking capability,
  changed flow, new provider), check whether this landing page's marketing copy,
  demo widget, or FAQ need updating too, and vice versa — check whether
  landing-page promises (features, screenshots, copy) still hold after backend/widget
  changes in `orli-calendar`.

## Running locally

```bash
python -m http.server 8899
# then open http://localhost:8899/
```

`file://` also works, except the Google Fonts (Fraunces + Inter) need network access;
without it the page falls back to Georgia / system sans.

There is no lint, build, or test command — verify changes by loading the page in a
browser.

## Architecture

Six independent, self-contained scripts loaded by `index.html`, each owning one concern.
They talk to the DOM, not to each other directly (with one exception: `scrolly.js`
drives `widget.js` through a controller handle):

- **`script.js`** — misc page glue: footer year, demo-form validation (client-side
  only, not wired to a backend), scroll-reveal via `IntersectionObserver`, the
  how-it-works card glow effect, and the FAQ accordion.
- **`site-i18n.js`** — whole-site language switch (English ⇄ Hebrew, LTR ⇄ RTL).
  **English lives in `index.html` and is the source of truth**, auto-captured from the
  DOM on load; this file only carries the Hebrew string table (`HE`), keyed by
  `data-i18n` (text/innerHTML) and `data-i18n-ph` (placeholder) attributes on elements
  in `index.html`. Switching language sets `<html lang>` + `<html dir>`; `styles.css`
  uses CSS logical properties so the whole layout mirrors itself with no
  direction-specific CSS needed. Choice persists in `localStorage` (`orli-lang`). When
  adding new copy: add the English text + `data-i18n="some.key"` in `index.html`, then
  add the matching Hebrew string to `HE` in `site-i18n.js`.
- **`widget.js`** — the live interactive booking widget shown in the "See it in
  action" section. A faithful vanilla-JS reproduction of the real Vue widget
  (`orli-calendar/widget/src/App.vue` + step components) driven by in-browser mock data
  (`CARDS`), with no backend: catalog → date → time → patient details → OTP confirm
  (any 6 digits works) → success. Bilingual strings live in its own `S` table (mirrors
  `widget/src/i18n.ts` from the real app) — separate from `site-i18n.js`'s table. It
  mounts onto any `[data-orli-widget]` element, exposing a controller on
  `el.__orli` with `setScene(i)` and `render()`. Scoped entirely under `.orli-live` in
  `widget.css` so it never leaks into the marketing site's own styles.
- **`scrolly.js`** — drives the pinned widget in the "See it in action" section: as
  numbered `.scrolly-step` elements scroll past (tracked via `IntersectionObserver`
  with a rootMargin centered on the viewport), it calls `mountEl.__orli.setScene(i)` to
  advance the widget to the matching booking state.
- **`hero-gradient.js`** — dependency-free vanilla-WebGL animated gradient (simplex
  noise, GLSL inline as JS strings) for the hero `<canvas id="heroGradient">`. Falls
  back to a static CSS gradient (`.hero--nogl` class) when WebGL is unavailable, and
  freezes on `prefers-reduced-motion`.
- **`styles.css`** — all styling: theme tokens (light/dark), responsive layout, and the
  logical-properties setup that makes RTL "just work" for `site-i18n.js`.
- **`widget.css`** — styling for the live widget only, scoped under `.orli-live`.

## Conventions worth knowing

- No build tooling: files are loaded as plain `<script>` tags directly by
  `index.html`, in dependency order (i18n captures the DOM, scrolly/widget wire
  together via `__orli`, etc.) — keep that order if you add or reorder scripts.
- Scripts wrap themselves in an IIFE (`(function () { 'use strict'; ... })()`) rather
  than using ES modules.
- The site is bilingual by design (Hebrew primary, English secondary) — any new
  user-facing text needs both an English string in the HTML and a Hebrew override in
  `site-i18n.js` (or in `widget.js`'s own `S` table if it's inside the widget).
- `assets/brand/` holds logo/wordmark source + exported PNGs (including a Hebrew
  wordmark variant); `.assetsignore` suggests deploys target Cloudflare Pages, though
  no `wrangler.jsonc` is checked in yet.
