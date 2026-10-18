# DESIGN.md: orliclinic.com

The marketing site and the product share one visual system. Its full
description lives in `../orli-calendar/DESIGN.md` (palette, type, radii,
components, and the reasons behind them). This file adds the rules the
**site** keeps breaking. Read both before styling anything. Where they
disagree, the rule here wins on this site.

## Flat, hairline first (no drop shadows)

Surfaces sit flat on the cream page. Two surfaces are separated by the
hairline (`--line`, `#e4ddcf`) and, if needed, a tonal step (`--cream` →
`--cream-2` → `--surface`). **A drop shadow is not a way to separate,
lift or "make premium" anything.** The admin's own rule applies here
unchanged: a panel at rest has a border and no shadow at all.

Do not add `box-shadow` (or `filter: drop-shadow`) to:

- cards, tiles, rows, list items, FAQ items, plan cards, comparison tables
- product mocks and demos: the admin screens (`.orli-panel` and everything
  inside it), the widget pictures, browser-chrome frames, phone frames
- images, swatches, badges, chips, toasts and notes inside a mock
- anything in a section that is just "content on the page"

A shadow is allowed only when something genuinely floats above the page
or the page is behind it:

- the sticky nav once the page has scrolled under it
- the contact `<dialog>` and its backdrop
- the floating accessibility button and its open panel
- the cursor drawn inside a demo (it is a pointer, not a surface)

When one of those needs a shadow, use the warm green-black house tokens
(`--shadow-sm`, `--shadow`) from `styles.css`. Never a neutral grey or
black, never a hand-tuned new value, never two layers.

Focus rings and selection outlines (`box-shadow: 0 0 0 2px …` with no blur
and no offset) are borders, not shadows. They are fine.

### Known exceptions still in the code

These predate this rule. Remove them when you next touch the file; don't
copy them:

- `styles.css`: the hero's browser mock (`.browser`, `--shadow-lg`), the
  demo browser (`.demo-browser`, `.scrolly-sticky .demo-browser`), the
  code card (`.code-card`), the `.swatches span` dots, the FAQ items, the
  plan cards, and the other cards using `--shadow` / `--shadow-sm`
- `panel.css` and `panel-rows.css` are already flat; keep them that way.

## Product mocks and demos

- Draw the admin and the widget the way the product draws them: same
  labels (copied from `orli-calendar/admin/src/i18n.ts` and the widget's
  `i18n.ts`, never invented), same sidebar order and grouping
  (`AppShell.vue`), same icons.
- No decorative frame around a mock: no tinted box, no device or browser
  chrome around the admin, no outer border or rounded "stage". The mock
  sits on the page by itself.
- A made-up dashboard (tiles, charts, totals) is shown only with the
  admin's own "דוגמה" (sample) mark. Small counts that are part of a
  screen's normal UI (a page count, "2 waiting") need no mark.
- Every animated mock rests on its finished state: with no JS, with
  `prefers-reduced-motion`, or with the accessibility menu's motion off,
  it shows the screen done and nothing moves.

## Buttons

`.btn-dark` / `.btn-cream` on hover grow slowly to `scale: 1.05` and keep
their colours (as on `main`). No lift, no colour change, no shadow on
hover. No hover effect on touch (`@media (hover: none)`).
