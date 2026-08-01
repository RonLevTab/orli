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
appointment for themselves here.

## Product Purpose

This site is the marketing front door for **Orli**, an online-booking add-on
for clinics running Optima. It has to do two jobs: explain what Orli does and
why it's safe to adopt (nothing to replace, nothing new for staff to learn),
and convert a decision-maker into a demo request via the CTA form
(`cta.h2`/`#contact`).

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
- The "See it in action" section (`widget.js` + `scrolly.js`) runs a
  faithful, backend-less reproduction of the real product's booking widget so
  a visitor can try the flow without a real clinic or calendar behind it.
- Bilingual by design, Hebrew primary / English secondary, full RTL⇄LTR
  mirroring via `site-i18n.js` — see [CLAUDE.md](CLAUDE.md) for the mechanism.

## Capabilities and Constraints

- Static HTML/CSS/JS, no build step, no framework, no dependencies (see
  `CLAUDE.md` for the six-script architecture).
- The interactive widget demo plays a scripted flow (catalog → date → time →
  patient → OTP confirm, any 6 digits works → success) against mock data; it
  must keep faithfully mirroring the real widget's flow, steps, and copy as
  that product evolves — see this repo's and `orli-calendar`'s CLAUDE.md
  "Related project" sections.
- Roadmap section (`road.*`) distinguishes shipped capabilities ("זמין עכשיו":
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
3. **Show, don't just tell.** The live interactive widget demo carries more
   persuasive weight than the copy around it; keeping it faithful to the real
   product is a marketing requirement, not just a documentation nicety.
4. **Say only what's shipped.** Roadmap items are explicitly labeled "coming
   soon" and never presented as available today, matching the real product's
   own "say only what is true" principle.
5. **Hebrew-first, RTL-correct.** The primary audience reads Hebrew; English is
   a secondary, fully-mirrored experience, not an afterthought bolted onto an
   English-first layout.

## Accessibility & Inclusion

No product-specific conformance standard has been established. Absent one,
hold to WCAG AA contrast and keyboard operability as the working floor,
matching `orli-calendar`'s stated floor for the product itself.
