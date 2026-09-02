/* ============================================================
   Scroll-pinned "See it in action".
   The booking widget stays pinned while numbered steps scroll past;
   each step drives the widget to the matching booking state.

   This section used to embed the live booking service by iframe
   (booking.orliclinic.com/?demo=true) and drive it with postMessage.
   It now drives the local static replica in widget.js through the
   controller handle that script installs on the mount element
   (el.__orli), so the page keeps working when that service is
   unreachable. See widget.js's header for how to refresh the replica
   against the real widget.
   ============================================================ */
(function () {
  'use strict';

  function start() {
    var section = document.getElementById('demo');
    if (!section) return;
    var mountEl = section.querySelector('[data-orli-widget]');
    var steps = [].slice.call(section.querySelectorAll('.scrolly-step'));
    var tabs = [].slice.call(section.querySelectorAll('.scrolly-tab'));
    if (!mountEl || !mountEl.__orli || !steps.length) return;

    var widget = mountEl.__orli;
    // SOURCE: orli-calendar/widget/src/App.vue — STEP_ORDER, plus 'success'.
    // widget.js's setScene() takes the index into this same list.
    var STEP_NAMES = ['catalog', 'date', 'time', 'patient', 'confirm', 'success'];
    var current = -1;
    // Below this breakpoint .scrolly-sticky is position:static and the widget
    // is driven by the tap-through tabs instead of scroll-jacking (see
    // styles.css). Only the pinned desktop layout should follow the widget's
    // own step changes with scrollIntoView — on mobile that yanked the page
    // out from under the user's finger on every tap inside the widget.
    var isPinned = window.matchMedia('(min-width: 921px)');

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
      widget.setScene(i);
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () { activate(idx); });
    });

    // The visitor can also click their own way through the widget. When that
    // lands on a different step than the one we asked for, follow along in the
    // step list — the sync the iframe's 'step' postMessage used to provide.
    // setActiveUI() has already set `current` for scene changes we drove, so
    // the echo of our own setScene() call falls out here.
    widget.onStep = function (name) {
      var i = STEP_NAMES.indexOf(name);
      if (i >= 0 && i !== current) {
        setActiveUI(i);
        if (isPinned.matches) steps[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    activate(0);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var i = steps.indexOf(e.target);
            if (i >= 0) activate(i);
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    }

    // The scroll narrative is for passive readers. index.html invites the
    // visitor to drive it themselves ("נסו את התוסף בעצמכם"), and until now
    // the next scroll nudge called setScene() -> reset(), throwing away
    // whatever they had typed. So the first real touch inside the widget hands
    // over control for good: the observer stops, and widget.onStep (wired
    // above) keeps the step list following them instead of leading them.
    // The numbered tabs still work — clicking one is an explicit request to
    // jump, not an accident of scrolling.
    var released = false;
    function release() {
      if (released) return;
      released = true;
      if (io) io.disconnect();
    }
    ['pointerdown', 'keydown'].forEach(function (evt) {
      mountEl.addEventListener(evt, release);
    });
  }

  // widget.js mounts on DOMContentLoaded, and its <script> tag comes first, so
  // its listener runs before this one and el.__orli exists by the time we look.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
