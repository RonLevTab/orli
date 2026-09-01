/* ============================================================
   Scroll-pinned "See it in action" (Vectrix-style).
   The booking widget stays pinned while numbered steps scroll
   past; each step drives the pinned widget to the matching
   booking state via its own setScene(i) controller.
   ============================================================ */
(function () {
  'use strict';

  var section = document.getElementById('demo');
  if (!section) return;
  var mountEl = section.querySelector('[data-orli-widget]');
  var steps = [].slice.call(section.querySelectorAll('.scrolly-step'));
  var tabs = [].slice.call(section.querySelectorAll('.scrolly-tab'));
  if (!mountEl || !steps.length) return;

  function ctrl() { return mountEl.__orli; }

  var current = -1;

  function setActiveUI(i) {
    current = i;
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    tabs.forEach(function (t, idx) {
      t.classList.toggle('is-active', idx === i);
      t.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
  }

  function activate(i) {
    if (i === current) return;
    setActiveUI(i);
    var c = ctrl();
    if (c && c.setScene) c.setScene(i);
  }

  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { activate(idx); });
  });

  // Start on the first scene.
  activate(0);

  // A line at ~52% of the viewport (the widget's vertical centre). Whichever
  // step spans that line is the active one, so the scene only changes when a
  // new step actually reaches the widget's centre. Each step is tall, so it
  // stays active across a comfortable scroll range before the next takes over.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var i = steps.indexOf(e.target);
          if (i >= 0) activate(i);
        }
      });
    }, { rootMargin: '-52% 0px -48% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }
})();
