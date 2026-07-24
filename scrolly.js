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
  if (!iframe || !steps.length) return;

  var STEP_NAMES = ['catalog', 'date', 'time', 'patient', 'confirm', 'success'];
  var current = -1;
  var loaded = false;

  function send(i) {
    if (loaded && iframe.contentWindow && STEP_NAMES[i]) {
      iframe.contentWindow.postMessage({ type: 'orli-demo-step', step: STEP_NAMES[i] }, '*');
    }
  }

  function activate(i) {
    if (i === current) return;
    current = i;
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    send(i);
  }

  iframe.addEventListener('load', function () {
    loaded = true;
    if (current >= 0) send(current);
  });

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'optima-booking-widget') return;
    if (e.data.type === 'resize' && typeof e.data.height === 'number') {
      iframe.style.height = e.data.height + 'px';
    }
    if (e.data.type === 'step' && typeof e.data.step === 'string') {
      var i = STEP_NAMES.indexOf(e.data.step);
      if (i >= 0 && i !== current) {
        current = i;
        steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
        steps[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    }, { rootMargin: '-52% 0px -48% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }
})();
