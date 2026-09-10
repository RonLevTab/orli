/* ============================================================
   Section stepping, desktop only.
   styles.css turns every top-level section (and each step of the demo)
   into a full-viewport snap stop on wide, tall screens. This script makes
   the wheel and the scrolling keys move the page one stop at a time: a
   wheel gesture or a key takes the visitor to the next (or previous)
   stop, and the next gesture only counts once that scroll has landed, so
   a fast flick never skips a section. Nothing is held: the page rests on
   a section until the visitor moves it again.

   Off on phones, on short screens and under prefers-reduced-motion, the
   same conditions under which styles.css does not snap. Off while the
   contact dialog is open. A wheel or a key over something that scrolls on
   its own (a FAQ answer taller than the screen, the widget's step area)
   scrolls that instead. Anchor links, scrollbar drags and the demo's own
   scrolls (scrolly.js following a click inside the widget) move the page
   as they always did; this script only waits for them to land.
   ============================================================ */
(function () {
  'use strict';

  var active = window.matchMedia('(min-width: 921px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
  var stops = [].slice.call(document.querySelectorAll('[data-lock-stop]'));
  if (!stops.length) return;

  var dialog = document.getElementById('contactDialog');
  var root = document.documentElement;
  var scrolling = false;
  var settleTimer = null;
  var ceilingTimer = null;

  function dialogOpen() { return !!(dialog && dialog.open); }
  function navHeight() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h'));
    return isNaN(v) ? 65 : v;
  }
  function edge(el) {
    if (el.tagName === 'FOOTER') return 'end';
    return el.getAttribute('data-lock-stop') === 'center' ? 'center' : 'start';
  }

  // The stop nearest its snap edge: start stops by their top (under the
  // nav), centre stops by their middle, the footer by its bottom.
  function nearestStop() {
    var vh = window.innerHeight;
    var top = navHeight();
    var best = 0, bestDist = Infinity;
    stops.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var e = edge(el);
      var d = e === 'end' ? Math.abs(r.bottom - vh)
        : e === 'center' ? Math.abs((r.top + r.bottom) / 2 - (top + (vh - top) / 2))
        : Math.abs(r.top - top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return { index: best, dist: bestDist };
  }

  function landed() {
    clearTimeout(settleTimer);
    clearTimeout(ceilingTimer);
    scrolling = false;
  }

  // Any movement of the page — ours, the demo's, an anchor link, the
  // scrollbar — counts as in flight until it has been quiet for a moment.
  window.addEventListener('scroll', function () {
    scrolling = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(landed, 120);
  }, { passive: true });
  if ('onscrollend' in window) window.addEventListener('scrollend', landed);

  function goTo(index, instant) {
    index = Math.max(0, Math.min(stops.length - 1, index));
    var el = stops[index];
    scrolling = true;
    clearTimeout(ceilingTimer);
    // If the browser never reports the end of that scroll, stop waiting.
    ceilingTimer = setTimeout(landed, 1400);
    el.scrollIntoView({ block: edge(el), behavior: instant ? 'instant' : 'smooth' });
    // A jump to where the page already is fires no scroll event.
    setTimeout(function () { if (nearestStop().dist <= 2) landed(); }, 30);
  }

  // Something under the pointer (or the focus) that can still scroll in
  // that direction — an opened FAQ answer on a short screen, the widget's
  // step area — scrolls itself.
  function innerScrollable(target, dy) {
    var el = target && target.nodeType === 1 ? target : null;
    while (el && el !== document.body) {
      var cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        if (dy < 0 && el.scrollTop > 0) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  // One step per gesture: a trackpad sends dozens of wheel events for one
  // swipe. The gesture reopens after a quiet spell, and never before the
  // scroll it started has landed.
  var gestureTimer = null;
  var gestureOpen = true;
  function step(dir) {
    if (!gestureOpen || scrolling) return;
    gestureOpen = false;
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(function () { gestureOpen = true; }, 600);
    goTo(nearestStop().index + dir, false);
  }

  function onWheel(e) {
    if (dialogOpen()) return;
    if (innerScrollable(e.target, e.deltaY)) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < 4) return;
    step(e.deltaY > 0 ? 1 : -1);
  }

  var KEY_DIR = { PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  function onKey(e) {
    if (dialogOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target && e.target.nodeType === 1 ? e.target : null;
    // Typing, or moving inside the widget, is not scrolling.
    if (t && (t.matches('input, textarea, select, [contenteditable]') || t.closest('[data-orli-widget]'))) return;
    // Space on a focused button or link activates it; the browser's own
    // page-down on Space is only taken over when nothing has the focus.
    if (e.key === ' ') {
      if (t && t.closest('button, a, summary, [role="button"], [tabindex]')) return;
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      // Straight there: a smooth scroll across the demo would walk the
      // widget through every step on the way.
      goTo(e.key === 'Home' ? 0 : stops.length - 1, true);
      return;
    }
    var dir = KEY_DIR[e.key];
    if (!dir) return;
    if (innerScrollable(t, dir)) return;
    e.preventDefault();
    step(dir);
  }

  var wired = false;
  function wire() {
    if (wired || !active.matches) return;
    wired = true;
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
  }
  function unwire() {
    if (!wired) return;
    wired = false;
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    landed();
  }
  if (active.addEventListener) active.addEventListener('change', function () { if (active.matches) wire(); else unwire(); });
  wire();
})();
