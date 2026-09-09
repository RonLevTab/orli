/* ============================================================
   Section lock-in, desktop only.
   styles.css turns every top-level section (and each step of the demo)
   into a full-viewport snap stop on wide, tall screens. This script makes
   the page move one stop at a time: a wheel gesture or a scrolling key
   takes the visitor to the next (or previous) stop, and once it has
   settled the page holds for two seconds — wheel, touch and keys are
   swallowed — so a whole section is read before the page can move on.
   The nav's bottom hairline fills over those two seconds (styles.css,
   html.is-holding) so the pause reads as intended, not as a stuck page.

   Off on phones, on short screens and under prefers-reduced-motion, the
   same conditions under which styles.css does not snap. Never holds while
   the contact dialog is open, and a wheel over something that scrolls on
   its own (an opened FAQ answer taller than the screen) scrolls that.
   Anchor links still jump freely; the hold starts afresh at the target.
   ============================================================ */
(function () {
  'use strict';

  var HOLD_MS = 2000;
  var active = window.matchMedia('(min-width: 921px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
  var stops = [].slice.call(document.querySelectorAll('[data-lock-stop]'));
  if (!stops.length) return;

  var dialog = document.getElementById('contactDialog');
  var root = document.documentElement;
  var locked = false;
  var moving = false;
  var lockTimer = null;
  var moveTimer = null;
  var current = -1;

  function dialogOpen() { return !!(dialog && dialog.open); }
  function isCentre(el) { return el.getAttribute('data-lock-stop') === 'center'; }

  function release() {
    locked = false;
    clearTimeout(lockTimer);
    root.classList.remove('is-holding');
  }

  function hold() {
    if (!active.matches || dialogOpen()) return;
    locked = true;
    clearTimeout(lockTimer);
    // Off and on again on the next frame, so the hairline's fill restarts.
    root.classList.remove('is-holding');
    window.requestAnimationFrame(function () { root.classList.add('is-holding'); });
    lockTimer = setTimeout(release, HOLD_MS);
  }

  // The stop nearest its snap edge: start stops by their top, centre stops
  // by their middle.
  function nearestStop() {
    var vh = window.innerHeight;
    var best = 0, bestDist = Infinity;
    stops.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var d = isCentre(el) ? Math.abs((r.top + r.bottom) / 2 - vh / 2) : Math.abs(r.top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return { index: best, dist: bestDist };
  }

  function goTo(index) {
    index = Math.max(0, Math.min(stops.length - 1, index));
    if (index === current && !moving) return;
    moving = true;
    clearTimeout(moveTimer);
    var el = stops[index];
    var align = isCentre(el) ? 'center' : (el.tagName === 'FOOTER' ? 'end' : 'start');
    el.scrollIntoView({ block: align, behavior: 'smooth' });
    // If the browser never reports the end of that scroll, give up waiting.
    moveTimer = setTimeout(onSettle, 1400);
  }

  function onSettle() {
    if (!active.matches) return;
    clearTimeout(moveTimer);
    var near = nearestStop();
    // A stop can land a few pixels off its edge (the nav, rounding); it
    // still counts as settled. Anything further is a scroll in progress.
    if (near.dist > 40) return;
    moving = false;
    if (near.index === current) return;
    current = near.index;
    hold();
  }

  // scrollend where the browser has it; a quiet 120ms on scroll otherwise.
  var quiet = null;
  if ('onscrollend' in window) {
    window.addEventListener('scrollend', onSettle);
  } else {
    window.addEventListener('scroll', function () {
      clearTimeout(quiet);
      quiet = setTimeout(onSettle, 120);
    }, { passive: true });
  }

  // A wheel over something that can still scroll in that direction (an
  // opened FAQ answer on a short screen, the dialog) scrolls that instead.
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

  var gestureTimer = null;
  var gestureOpen = true;
  function step(dir) {
    if (!gestureOpen) return;
    // One step per gesture: a trackpad sends dozens of wheel events for one
    // swipe, and the hold that follows closes the gap anyway.
    gestureOpen = false;
    clearTimeout(gestureTimer);
    gestureTimer = setTimeout(function () { gestureOpen = true; }, 700);
    var from = current >= 0 ? current : nearestStop().index;
    goTo(from + dir);
  }

  window.addEventListener('wheel', function (e) {
    if (!active.matches || dialogOpen()) return;
    if (innerScrollable(e.target, e.deltaY)) return;
    e.preventDefault();
    if (locked || moving || Math.abs(e.deltaY) < 4) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('touchmove', function (e) {
    if (!active.matches || dialogOpen()) return;
    if (locked || moving) e.preventDefault();
  }, { passive: false });

  var KEY_DIR = { ' ': 1, PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };
  window.addEventListener('keydown', function (e) {
    if (!active.matches || dialogOpen()) return;
    var t = e.target;
    // Typing in the widget's fields, or moving inside them, is not scrolling.
    if (t && t.nodeType === 1 && (t.matches('input, textarea, select, [contenteditable]') || t.closest('[data-orli-widget]'))) return;
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (!locked && !moving) goTo(e.key === 'Home' ? 0 : stops.length - 1);
      return;
    }
    var dir = KEY_DIR[e.key] || (e.key === ' ' && e.shiftKey ? -1 : 0);
    if (!dir) return;
    e.preventDefault();
    if (locked || moving) return;
    step(e.key === ' ' && e.shiftKey ? -1 : dir);
  });

  // Leaving the desktop conditions ends any hold at once.
  if (active.addEventListener) active.addEventListener('change', function () { if (!active.matches) { release(); moving = false; } });

  // The first stop on load is a hold like any other, capped by HOLD_MS.
  if (document.readyState === 'complete') onSettle();
  else window.addEventListener('load', function () { setTimeout(onSettle, 50); });
})();
