/* ============================================================
   Drives the mock admin panel on panel.html.

   Same idea as scrolly.js on index.html — numbered steps scroll past a
   pinned frame and select what it shows — but deliberately NOT sharing
   that file's code. scrolly.js carries machinery this page has no use
   for: the widget's controller handle, the rule that hands control to
   the visitor on first touch, and the orli:restart re-arm. None of that
   applies here, because the panel is a walkthrough with nothing to
   interact with. Keeping them apart means the simple consumer can't
   inherit the complicated one's bugs.

   The markup is static in panel.html; this only toggles which pane and
   which sidebar item are active.
   ============================================================ */
(function () {
  'use strict';

  function start() {
    var section = document.getElementById('panel');
    if (!section) return;

    var panel = section.querySelector('[data-orli-panel]');
    var steps = [].slice.call(section.querySelectorAll('.scrolly-step'));
    var tabs = [].slice.call(section.querySelectorAll('.scrolly-tab'));
    var panes = [].slice.call(section.querySelectorAll('.opn-pane'));
    var navBtns = [].slice.call(section.querySelectorAll('.opn-nav-btn'));
    if (!panel || !steps.length || !panes.length) return;

    var current = -1;

    function show(i) {
      if (i === current) return;
      current = i;

      steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      tabs.forEach(function (t, idx) {
        t.classList.toggle('is-active', idx === i);
        t.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
      panes.forEach(function (p, idx) { p.classList.toggle('is-active', idx === i); });

      // A sidebar item can own more than one step — steps 01 and 02 are two
      // tabs inside the same "מטפלים ושירותים" screen, which is how the real
      // admin nests them (router.ts: /practitioners/:pid?/:tab?).
      navBtns.forEach(function (b) {
        var owns = (b.getAttribute('data-nav') || '').split(' ');
        b.classList.toggle('is-active', owns.indexOf(String(i)) >= 0);
      });
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () { show(idx); });
    });

    show(0);

    // Whichever step is nearest the middle of the screen is the one being
    // read, so that is the one to show.
    //
    // Deliberately a scroll listener rather than an IntersectionObserver.
    // index.html's booking demo uses an observer with a narrow centre band,
    // which suits it — but here it produced stuck and out-of-order panes:
    // an observer only reports when an element *crosses* a boundary, so any
    // scroll that doesn't cross one leaves the panel showing a stale screen,
    // and when several steps cross at once the entry order is not scroll
    // order. Measuring five rectangles inside a rAF is cheap and exact.
    var ticking = false;
    function pick() {
      ticking = false;
      var mid = window.innerHeight / 2;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < steps.length; i++) {
        var r = steps[i].getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      show(best);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(pick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Second trigger for the same measurement. The two fire in different
    // situations — a scroll event on every movement, the observer whenever a
    // step crosses the centre band — and either one alone has left the panel
    // showing a stale screen. They both just ask pick() to re-measure, so
    // running twice is harmless and missing one is not.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(onScroll, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    }

    pick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
