# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketing site for **Orli**, an online-booking add-on for clinics running the legacy
**Optima** scheduling system. Plain static HTML/CSS/JS — no build step, no package
manager, no dependencies, no tests.

Four pages, all sharing the same header/footer shell and `styles.css`:

- **`index.html`** — the story: hero through CTA, written for the clinic owner/office
  manager deciding whether to adopt Orli.
- **`integration.html`** — customization (branding presets, email content, all done
  through the clinic's own admin panel, no code) plus the embed snippet and
  scope/security/Optima-sync facts. Linked from primary nav (`התאמה אישית`) since the
  branding content is decision-maker-relevant, not just for whoever handles the embed.
  Keep technical claims here verified against `orli-calendar`'s actual code, not
  aspirational — see `PRODUCT.md` for why this page exists and what it must not claim.
- **`about.html`** — mission/principles only. Orli has exactly one real customer
  (`PRODUCT.md`), so there is no team, funding, or customer-count content here to write
  yet — don't invent any.
- **`privacy.html`** — a structural **draft**, explicitly marked as such on the page
  (`noindex`, a visible banner, and `[להשלמה משפטית]` placeholders). Built around the
  disclosure categories Israel's Protection of Privacy Law Amendment 13 (effective
  2025-08-14) requires, but several fields (legal basis, retention period, DPO
  requirement) need real legal review, not more guessing — appointment/treatment-type
  data tied to an identified patient likely qualifies as "sensitive information" under
  that law, which is a live open question for Orli itself, not just for clinic
  customers. Don't fill in the placeholders without an actual legal decision.

All four pages are footer-linked to each other; only `index.html`'s content sections,
`integration.html`, and the demo/compare/FAQ anchors are in primary nav.

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

Four independent, self-contained scripts loaded by `index.html`, each owning one concern.
They talk to the DOM, not to each other directly (with one exception: `scrolly.js`
drives `widget.js` through a controller handle):

- **`script.js`** — misc page glue: footer year, demo-form validation (client-side
  only, not wired to a backend), scroll-reveal via `IntersectionObserver`, and the
  FAQ accordion.
- **`widget.js`** — the live interactive booking widget shown in the "See it in
  action" section. A faithful vanilla-JS reproduction of the real Vue widget
  (`orli-calendar/widget/src/App.vue` + step components) driven by in-browser mock data
  (`CARDS`), with no backend: catalog → date → time → patient details → OTP confirm
  (any 6 digits works) → success. The widget itself is bilingual (Hebrew/English toggle
  in its own UI) with strings in its own `S` table, mirroring `widget/src/i18n.ts` from
  the real app — this is a property of the widget product, not of the marketing site
  around it. It mounts onto any `[data-orli-widget]` element, exposing a controller on
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
- **`styles.css`** — all styling: theme tokens (light/dark) and responsive layout.
- **`widget.css`** — styling for the live widget only, scoped under `.orli-live`.

## Conventions worth knowing

- No build tooling: files are loaded as plain `<script>` tags directly by
  `index.html`, in dependency order (scrolly/widget wire together via `__orli`, etc.) —
  keep that order if you add or reorder scripts.
- Scripts wrap themselves in an IIFE (`(function () { 'use strict'; ... })()`) rather
  than using ES modules.
- The marketing site itself is Hebrew-only (`<html lang="he" dir="rtl">`), no runtime
  language switch — copy lives directly in `index.html`, no i18n table to keep in sync.
  The live booking widget (`widget.js`) is a separate case: it has its own
  Hebrew/English toggle mirroring the real product, kept in its own `S` table.
- `assets/brand/` holds logo/wordmark source + exported PNGs (including a Hebrew
  wordmark variant); `.assetsignore` suggests deploys target Cloudflare Pages, though
  no `wrangler.jsonc` is checked in yet.
