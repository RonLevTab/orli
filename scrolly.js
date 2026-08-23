/* ============================================================
   Scroll-pinned "See it in action" (Vectrix-style).
   The booking widget (iframe) stays pinned while numbered steps
   scroll past; each step drives the widget to the matching step
   via postMessage.
   ============================================================ */
(function () {
  'use strict';

  var section = document.getElementById('demo');
  if (!section) return;
  var iframe = section.querySelector('[data-orli-demo]');
  var steps = [].slice.call(section.querySelectorAll('.scrolly-step'));
  var tabs = [].slice.call(section.querySelectorAll('.scrolly-tab'));
  if (!iframe || !steps.length) return;

  var STEP_NAMES = ['catalog', 'date', 'time', 'patient', 'confirm', 'success'];
  var current = -1;
  var loaded = false;
  // Below this breakpoint .scrolly-sticky is position:static and the widget
  // is driven by the tap-through tabs instead of scroll-jacking (see
  // styles.css). Only the pinned desktop layout should follow the widget's
  // own step changes with scrollIntoView — on mobile that yanked the page
  // out from under the user's finger on every tap inside the iframe, which
  // is what was breaking touch (a mouse click has no such tap held down to
  // cancel).
  var isPinned = window.matchMedia('(min-width: 921px)');

  function send(i) {
    if (loaded && iframe.contentWindow && STEP_NAMES[i]) {
      iframe.contentWindow.postMessage({ type: 'orli-demo-step', step: STEP_NAMES[i] }, '*');
    }
  }

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
    send(i);
  }

  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { activate(idx); });
  });

  iframe.addEventListener('load', function () {
    loaded = true;
    if (current >= 0) send(current);
  });

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'optima-booking-widget') return;
    // Not consuming 'resize' messages: the widget reports its own root
    // element's scrollHeight, but in this fixed-height card layout the
    // overflow lives on the widget's *inner* step container, not its root
    // — so the root's scrollHeight just echoes back the card's current
    // fixed height, never the content's true height. It can't tell us how
    // tall a step actually wants to be; the card height below is sized by
    // hand for the tallest step instead (see .demo-browser in styles.css).
    if (e.data.type === 'step' && typeof e.data.step === 'string') {
      var i = STEP_NAMES.indexOf(e.data.step);
      if (i >= 0 && i !== current) {
        setActiveUI(i);
        if (isPinned.matches) steps[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

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
})();
