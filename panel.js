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
      // Buttons in a sequence, not an ARIA tablist — see scrolly.js's
      // setActiveUI for why the tab roles came off both pages.
      tabs.forEach(function (t, idx) {
        t.classList.toggle('is-active', idx === i);
        if (idx === i) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
      });
      panes.forEach(function (p, idx) { p.classList.toggle('is-active', idx === i); });
      // Steps 05 and 06 are account pages (הגדרות מרפאה, עזרה ותמיכה): in
      // the real admin they live in the avatar menu, not the rail
      // (AppShell.vue), so the mock opens that menu while one of them is up.
      panel.classList.toggle('is-account', panes[i].hasAttribute('data-account'));

      // The mock's sidebar is a horizontal scrolling strip on a phone, so the
      // item this step highlights is often off-screen — the walkthrough's
      // whole payoff, invisible. Bring it along by scrolling the strip itself
      // rather than calling scrollIntoView, which is free to move the page and
      // would fight the scroll narrative driving this in the first place.
      // The rail's own item, not the account menu's: both carry data-nav
      // for the account pages, and only the rail is the strip that scrolls.
      var activeNav = navBtns.filter(function (b) {
        return b.closest('.opn-sidebar') && (b.getAttribute('data-nav') || '').split(' ').indexOf(String(i)) >= 0;
      })[0];
      // Measured from the rendered boxes, not offsetLeft: under RTL,
      // scrollLeft counts from the right edge and runs negative, so the
      // offset arithmetic this used to do left every item past the first
      // fold off-screen. Nudging scrollLeft by the overshoot works the same
      // way in both directions.
      var strip = activeNav && activeNav.closest('.opn-sidebar');
      if (strip && strip.scrollWidth > strip.clientWidth) {
        var sr = strip.getBoundingClientRect();
        var ar = activeNav.getBoundingClientRect();
        if (ar.right > sr.right - 8) strip.scrollLeft += ar.right - sr.right + 10;
        else if (ar.left < sr.left + 8) strip.scrollLeft += ar.left - sr.left - 10;
      }

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
    // Below 920px the steps are a tap-through stepper (styles.css): only the
    // active one is laid out, so every step measures 0×0 at the top and
    // "nearest the middle" was always step 01 — each scroll on a phone
    // snapped the panel back to the first screen after any tab was tapped.
    // Scroll drives the panel only in the pinned layout.
    var isPinned = window.matchMedia('(min-width: 921px)');
    var ticking = false;
    function pick() {
      ticking = false;
      if (!isPinned.matches) return;
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
