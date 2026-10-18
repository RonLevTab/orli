/* panel.html: the admin screens as rows. Each row slides in the first
   time it comes into view (.is-in), and its demo loop then plays while
   the row is on screen (.is-running). Leaving the screen resets the loop
   (.is-reset for a frame), so a row always plays from its beginning. The
   loops themselves are CSS (panel-rows.css); this only says when.

   Motion is opt-in: .prows-anim on the section turns the entrances and
   loops on. Without it (no JS, reduced motion, or the accessibility
   menu's motion off) every row stands settled, its screen finished. */
(function () {
  'use strict';

  var section = document.querySelector('[data-prows]');
  if (!section) return;
  var rows = Array.prototype.slice.call(section.querySelectorAll('.prow'));
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var observer = null;
  var timers = [];

  function stillWanted() {
    return (reduce && reduce.matches) || document.documentElement.classList.contains('a11y-still');
  }

  function settle() {
    section.classList.remove('prows-anim');
    rows.forEach(function (row) { row.classList.add('is-in'); row.classList.remove('is-running', 'is-reset'); });
  }

  function run(row) {
    row.classList.remove('is-reset');
    row.classList.add('is-running');
  }

  function start() {
    if (!('IntersectionObserver' in window) || stillWanted()) { settle(); return; }
    section.classList.add('prows-anim');
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var row = e.target;
        // Seen: a quarter of the row in view above the bottom fifth of the
        // screen, or, for a row taller than that area, any of it.
        var tall = e.rootBounds && e.boundingClientRect.height > e.rootBounds.height;
        var seen = e.isIntersecting && (e.intersectionRatio >= 0.25 || tall);
        row.dataset.visible = e.isIntersecting ? '1' : '0';
        if (seen && !row.classList.contains('is-in')) {
          row.classList.add('is-in');
          // Let the entrance mostly land before the loop starts.
          timers.push(setTimeout(function () {
            if (row.dataset.visible === '1') run(row);
          }, 450));
        } else if (seen) {
          run(row);
        } else if (!e.isIntersecting && row.classList.contains('is-running')) {
          row.classList.remove('is-running');
          row.classList.add('is-reset');
        }
      });
    }, { threshold: [0, 0.25, 0.5], rootMargin: '0px 0px -20% 0px' });
    rows.forEach(function (row) { observer.observe(row); });
  }

  function stop() {
    if (observer) { observer.disconnect(); observer = null; }
    timers.forEach(clearTimeout); timers = [];
    settle();
  }

  function restart() {
    stop();
    start();
  }

  // The accessibility menu's motion switch (a11y.js announces it when the
  // visitor flips it) and the system setting, either way, at any time.
  window.addEventListener('orli:motion-still', stop);
  window.addEventListener('orli:motion-go', function () {
    if (!section.classList.contains('prows-anim')) restart();
  });
  if (reduce) {
    if (reduce.addEventListener) reduce.addEventListener('change', restart);
    else if (reduce.addListener) reduce.addListener(restart);
  }

  start();
})();
