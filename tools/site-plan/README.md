# Site plan (replica + section planner)

Source of the "תוכנית האתר של אורלי" artifact: a static replica of orliclinic.com with the proposed new pages and sections, and a sidebar to reorder, move, hide and annotate them. Published through Claude Code's Artifact tool; the arrangement is kept in the artifact's own database (doc `plan/current`).

The page has no `<html>`/`<head>` of its own (the artifact host wraps it). To open it locally, wrap it in a doctype + `<meta charset="utf-8">` and put these next to it under `media/`: `assets/brand/orli-wordmark-he.png`, `assets/brand/favicon-64.png`, and from `orli-outreach/videos/`: `booking-film/orli-booking-film.mp4` + poster, `ai-agent-teaser/orli-ai-agent-teaser.mp4` + poster.

Every section template carries a `data-why` with its rationale and the orli-calendar / product/features.md source it rests on.
