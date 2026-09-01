# Orli — marketing website

A single-page marketing site for **Orli**, the effortless online-booking layer for
clinics running the legacy **Optima** scheduling system. Static HTML/CSS/JS — no build
step, no dependencies.

## Files
- `index.html` — page markup and copy
- `styles.css` — all styling (theme tokens, light/dark, responsive)
- `script.js` — theme toggle (persisted), demo-form validation, reveal-on-scroll
- `site-i18n.js` — **whole-site language switch (English ⇄ Hebrew / LTR ⇄ RTL)**,
  wired to the `עב / EN` button in the nav. English lives in the HTML (source of
  truth, auto-captured on load); this file carries only the Hebrew overrides, keyed
  by `data-i18n` / `data-i18n-ph` attributes. Flipping language sets `<html lang>` +
  `<html dir>` and the CSS (logical properties) mirrors the layout automatically.
  Choice persists in `localStorage`. Latin runs (code snippet, email) stay LTR.
- `widget.css` / `widget.js` — the **live interactive booking widget** in the
  "See it in action" section: a faithful vanilla-JS reproduction of the real Vue
  widget (`orli-calendar/widget/src/App.vue` + step components), driven by in-browser
  mock data. Plays the whole flow — practitioner → treatment → date → time → patient
  → confirm (OTP) → success — with no backend. OTP accepts any 6 digits. Bilingual (Hebrew primary /
  English secondary), Apple-clean, Action-Blue accent, scoped under `.orli-live` so
  it never touches the marketing site's styles.

## Run locally
Any static server works. For example:

```bash
python -m http.server 8899
# then open http://localhost:8899/
```

(Opening `index.html` directly via `file://` also works, but the Google Fonts —
Fraunces + Inter — need a network connection; without one it falls back to Georgia /
system sans, which still looks clean.)

## Design
Warm editorial palette + serif display type (à la petaron.ai), fused with a teal brand
identity and a full-bleed teal CTA band (à la irisonthemove / Princeton Identity).
Notable patterns: floating pill nav, browser-chrome widget mockup, a **Without / With
Orli** comparison, numbered how-it-works panels, and an FAQ accordion.

## Wiring the demo form
`script.js` currently validates and shows a confirmation message client-side only.
Point the submit handler at a real endpoint (or form service) to capture leads.
