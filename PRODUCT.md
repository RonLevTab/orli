# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Clinic decision-makers** — owners and office managers at clinics running the
legacy Optima scheduling system. They land here evaluating whether to add
online booking, already living with the pain the copy names directly: patients
who can only book by phone or in person, a secretary keying every appointment
into Optima by hand, and requests piling up after hours. They read in Hebrew
(primary) and decide whether to request a demo — they are not booking an
appointment for themselves here. `index.html` is written for this reader:
story only, no code, no implementation detail.

**The decision-maker's web person or IT contact** — a secondary audience, reached
only once the decision-maker hands them a link, not by browsing the site
themselves. `integration.html` exists for them: the embed snippet and
surface-level facts about scope, data handling, and the Optima sync, verified
against `orli-calendar`'s real code rather than written speculatively. It is
deliberately not promoted in primary nav — a technical reference isn't part of
the persuasion story, it's a follow-up once the decision-maker is already sold.

## Product Purpose

This site is the marketing front door for **Orli**, an online-booking add-on
for clinics running Optima. It has to do two jobs: explain what Orli does and
why it's safe to adopt (nothing to replace, nothing new for staff to learn),
and convert a decision-maker into a demo request via the CTA form
(`#contact`).

Success is a clinic owner or office manager understanding the mechanism (their
existing Optima calendar, opened up to patients) well enough to submit the
demo-request form.

## Positioning

Same mechanism as the product itself: Orli sits on top of a clinic's existing
Optima calendar rather than asking the clinic to replace it. The page's own
comparison section (`#compare`, "without Orli" vs. "with Orli") is the
positioning argument made concrete — every difference traces back to one fact,
that Orli reads and writes the calendar staff already use, so nothing about
the clinic's existing workflow has to change.

## Operating Context

- This site **is** orliclinic.com, the product's live landing page — its own
  design tokens in `styles.css` are the source of truth, not a copy of an
  external reference. `orli-calendar`'s PRODUCT.md treats this site's tokens
  as binding for the whole product; changes here are upstream of that, not
  downstream.
- No backend: the demo-request form (`#demoForm` in `index.html`, handled by
  `script.js`) validates client-side only and is not wired to a real endpoint
  yet — see `README.md`'s "Wiring the demo form" note.
- `panel.html` shows the other half of the product: a static mock of the clinic
  admin, walked through in five steps. It exists because the site otherwise only ever
  shows the patient's side, and the owner's real question is whether opening the
  calendar costs her control of it. The mock mirrors `orli-calendar/admin`'s own
  labels and navigation; the automations screen is marked "בקרוב" there and must stay
  marked that way here.
- The "See it in action" section (`#demo`, driven by `scrolly.js`) shows a
  static, backend-less replica of the real product's booking widget so a
  visitor can follow the flow without a real clinic or calendar behind it.
  It briefly embedded the live service by iframe
  (`https://booking.orliclinic.com/?demo=true`); that was replaced because the
  landing page must not depend on a deployed service being reachable. The
  replica is derived from `orli-calendar/widget/src/`, and each part carries a
  source-path comment naming the file it mirrors, so refreshing it against the
  real widget is a lookup rather than an investigation.
- **Hebrew-only, permanently.** A whole-site language toggle (`site-i18n.js`
  plus `data-i18n` attributes) was built and then deliberately removed in
  commit `4d07431`, where it was found to be dead code the page never loaded.
  Do not reintroduce one. The booking widget's own Hebrew/English toggle is a
  property of that product, not of this site.

## Capabilities and Constraints

- Static HTML/CSS/JS, no build step, no framework, no dependencies (see
  `CLAUDE.md` for the script architecture).
- The widget demo walks the real product's flow (catalog → date → time →
  patient → OTP confirm, any 6 digits works → success) against local mock
  data; it must keep faithfully mirroring the real widget's flow, steps, and
  copy as that product evolves — see this repo's and `orli-calendar`'s
  CLAUDE.md "Related project" sections.
- The hero's widget picture (`.orli-live` in `index.html`, `aria-hidden`) is
  **decoration only**. It is not held to the real widget's appearance and may
  diverge freely; only the `#demo` replica carries the fidelity constraint.
- Roadmap section distinguishes shipped capabilities ("זמין עכשיו":
  patient self-booking, reschedule/cancel) from planned ones ("בקרוב": chatbot
  booking assistant, smart reminders) — this distinction is load-bearing and
  must stay accurate as the real product ships more of the roadmap.

## Brand Commitments

- Name: **Orli** (אורלי), positioned against the legacy system **Optima**
  (אופטימה) by name throughout the copy.
- Warm editorial palette (cream canvas, teal `#0f8a86` identity, dark-green ink,
  Heebo, pill buttons, 18px radius) per `styles.css` and `orli-calendar`'s
  PRODUCT.md — this site is that palette's origin, so changes here are brand
  decisions, not local styling choices.
- Wordmark assets (including a dedicated Hebrew variant) live in
  `assets/brand/`.

## Evidence on Hand

- **Verner Clinic** is the product's only real customer (per `orli-calendar`'s
  PRODUCT.md); the site names no clinic customers and shows no testimonials,
  logos, or usage metrics.
- **Absent — do not fabricate:** customer count beyond one, testimonials,
  logos, usage/performance metrics, pricing, or claims about the demo-request
  form going anywhere beyond client-side validation today.

## Product Principles

1. **The pitch is the mechanism, not a feature list.** Every section should
   trace back to "your Optima calendar, opened to patients" — that's the one
   claim a competing generic scheduling SaaS can't truthfully make.
2. **Nothing changes for staff.** The recurring reassurance across hero, FAQ,
   and comparison ("nothing to replace," "the secretary keeps working in
   Optima exactly as today") is the primary objection this page exists to
   defuse — don't let new copy contradict it.
3. **Show, don't just tell.** The widget demo carries more persuasive weight
   than the copy around it; keeping it faithful to the real product is a
   marketing requirement, not just a documentation nicety. Faithful never
   means live, though — the demo must still work with the booking service
   unreachable.
4. **Say only what's shipped.** Roadmap items are explicitly labeled "coming
   soon" and never presented as available today, matching the real product's
   own "say only what is true" principle.
5. **Hebrew-only, RTL-native.** The audience reads Hebrew; the site is written
   and laid out in Hebrew RTL with no translation layer. English appears only
   inside the booking widget's own toggle.

## Accessibility & Inclusion

No product-specific conformance standard has been established. Absent one,
hold to WCAG AA contrast and keyboard operability as the working floor,
matching `orli-calendar`'s stated floor for the product itself.
