# Brag Plan: אורלי (Orli)

## What is this app?
An online-booking add-on for clinics running Optima: patients book real free slots from the clinic's own website, and the appointment lands directly in the Optima calendar staff already use.

## The angle
A sales film for clinic owners, not a product tour. It opens on the owner's loss (the phone ringing in a closed clinic), shows how little the patient has to do, and spends its longest scene on what the owner is actually buying: an Optima calendar that fills itself overnight. Night → morning is the visual arc: the same illustrated clinic, dark and closed at the start, sunlit with a full diary at the end.

## Hook (first 2-3 seconds)
Flat-vector night illustration of a clinic, "סגור" sign on the door, a phone ringing into nothing, clock 21:14.
Line: **כמה מטופלים התקשרו אתמול אחרי שסגרתם?**

## Key moments (the middle)
- Missed-call cards stack up 1 → 2 → 3, then: **תא קולי לא קובע פגישות.**
- The real widget flow on a phone, in fast cuts: ד"ר כהן → 10:30 → verification code → **הפגישה נקבעה!** / אישור נשלח לאימייל.
- The Optima diary: four appointments drop in one by one; the 10:30 one is tagged "אורלי" and glows. The secretary just drinks her coffee.

## Outro / punchline
**הפכו את יומן האופטימה למנוע קביעת פגישות.** → the one-line embed snippet, **שורה אחת באתר. זהו.** → wordmark + **בחרו שעה להדגמה · orliclinic.com**

## User flow worth showing
Patient opens the corner widget on the clinic's site → picks practitioner and 10:30 → confirms with an emailed code → the appointment appears in Optima with nobody typing it.

## Tone
- Preset: polished
- Creative direction: warm flat-vector illustration + real UI motion; a calm, confident sales film for a cautious audience
- Interpretation: fast cuts only inside the phone; every sales line lands fast and then holds; no jokes, no hype words.

## Format: vertical — 1080x1920
## Duration: 24.8 seconds

## Visual identity (from the project)
- Background: #f7f5ef (cream); night scenes #16211f (the site's --dark)
- Accent: #0f8a86 teal, #0a5d5a teal-deep for text and fills, #14b8a6 bright for glows
- Text: #1b2523
- Display font: Heebo 700/800
- Body font: Heebo 400/500
- Strongest visual element: the booking widget and the "היומן באופטימה" calendar mock from the site's hero

## Share copy (draft)
כמה מטופלים התקשרו אתמול אחרי שסגרתם? עם אורלי הם קובעים בעצמם מהאתר שלכם, בכל שעה — והפגישה נכנסת ישר לאופטימה. בלי הקלדה, בלי טלפונים חוזרים.

## Audio direction
- Role: warm bed with sparse professional accents
- Music: happy-beats-business-moves-vol-12 (109.96 BPM), steady and clean
- Music treatment: starts at 0 at 0.30, fades out over the last 1.2s
- Music cue guidance: preset `assets/music/cues/…vol-12….music-cues.json`. Strong cues used: 8.74 (tap on 10:30), 13.11 (diary reveal), 17.47 (Orli appointment glow), 22.93 (logo). Diary rows land on every other beat from 14.20.
- Audio-reactive treatment: subtle; the moon / sun halo breathes with the bed. No visualizer graphics.
- SFX posture: sparse, motion-matched — soft clicks for taps, soft drops for calendar rows, one bell on the logo.
- Audio-coupled moments: taps in the phone, calendar rows, logo landing
- Restraint rule: nothing sharp, nothing louder than the music bed by much; no SFX on text.

## Storyboard

### Scene 1 — The closed clinic — 3.5s
Night illustration: clinic facade, moon, stars, "סגור" sign, ringing phone with sound rings, clock chip 21:14. Hook line types in as one block and holds ~2.4s.
Sequential/interaction: phone rings (finite wiggle).
Audio intent: quiet, slightly lonely. Audio-coupled idea: none.
Transition mood: soft → Scene 2

### Scene 2 — Missed calls — 3.1s
Same night palette. Three "שיחה שלא נענתה" notification cards stack one by one with times 19:42 / 20:30 / 21:14, counter badge 1→2→3. Then **תא קולי לא קובע פגישות.** holds 1.5s.
Sequential/interaction: yes — three cards, one per beat (non-text-heavy, the line is the read).
Audio intent: soft drops. Transition mood: clean wipe to cream → Scene 3

### Scene 3 — The patient books — 6.3s
Cream. Phone frame with the real widget look. Cuts: practitioner list (tap ד"ר כהן) → בחרו שעה chips (tap 10:30, beat-locked 8.74) → קוד אימות digits fill → הפגישה נקבעה! + אישור נשלח לאימייל. Above the phone: **המטופלים קובעים בעצמם.** then **בפחות מדקה, בכל שעה.**
Sequential/interaction: yes — simulated taps and typed code.
Audio intent: light clicks on taps. Transition mood: slide → Scene 4

### Scene 4 — Optima fills itself — 6.6s
"היומן באופטימה · יום ראשון 6.9 · ד"ר כהן". Four appointments drop into the grid on every other beat (14.20, 15.29, 16.38, 17.47); the last is the 10:30 ייעוץ · ישראל ישראלי with an "אורלי" tag and a glow (beat-locked 17.47). Secretary illustration with coffee below. Lines: **ישר לאופטימה.** then **בלי הקלדה. בלי טלפונים חוזרים.** (holds 1.8s)
Sequential/interaction: yes — four rows, each holds.
Audio intent: soft drops, satisfied. Transition mood: soft → Scene 5

### Scene 5 — The close — 5.3s
Cream, morning sun over the same clinic (now open, small, at the bottom). **הפכו את יומן האופטימה למנוע קביעת פגישות.** (holds 2.1s+, stays on screen) → snippet card + **שורה אחת באתר. זהו.** → wordmark + CTA pill **בחרו שעה להדגמה** + orliclinic.com (beat-locked 22.93, holds to end).
Audio intent: one warm bell on the logo, music fades.

**Music mood for this video:** upbeat, steady, clean
**Audio summary:** a quiet bed under a lonely night, light taps while the patient books, soft drops as the diary fills, one bell on the logo.
