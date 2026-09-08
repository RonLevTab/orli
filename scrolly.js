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
    // SOURCE: orli-calendar/widget/src/App.vue — the Step type. widget.js's
    // setScene() takes the index into this list; 'treatment' has no scene of
    // its own (scene 0's copy narrates picking a practitioner and a treatment
    // as one beat), so SCENE_OF maps it back onto scene 0 — otherwise Back
    // from the date step landed on a step the list had no answer for and the
    // text stayed parked on 02.
    var STEP_NAMES = ['practitioner', 'date', 'time', 'patient', 'confirm', 'success'];
    var SCENE_OF = { practitioner: 0, treatment: 0, date: 1, time: 2, patient: 3, confirm: 4, success: 5 };
    var current = -1;
    // Below this breakpoint .scrolly-sticky is position:static and the widget
    // is driven by the tap-through tabs instead of scroll-jacking (see
    // styles.css). Only the pinned desktop layout should follow the widget's
    // own step changes with scrollIntoView — on mobile that yanked the page
    // out from under the user's finger on every tap inside the widget.
    var isPinned = window.matchMedia('(min-width: 921px)');
    // Following the visitor's own clicks with a smooth scroll is movement
    // they did not ask for; under reduced motion the page jumps instead.
    var scrollTo = { behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' };

    // The numbered controls were marked up as an ARIA tablist, but nothing on
    // the page was ever a tabpanel and there was no arrow-key navigation, so
    // a screen reader announced "01, tab, selected" about a tab controlling
    // nothing. They are what they look like instead: buttons that jump the
    // demo to a step in a sequence, with aria-current="step" marking where
    // the visitor is. See the markup in index.html.
    function setActiveUI(i) {
      current = i;
      steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      tabs.forEach(function (t, idx) {
        t.classList.toggle('is-active', idx === i);
        if (idx === i) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
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

    // Size the card to the tallest scene, so no step ever scrolls inside it.
    // The real widget's fixed 580px frame is already short of its own confirm
    // step (see styles.css), and a narrow column or a fallback font wraps the
    // patient and confirm steps taller still — so this is measured, not
    // guessed: every scene is rendered once, the step area's overflow taken,
    // and the card grows past its CSS height by the largest. Runs before
    // onStep is wired, so the measuring renders don't drive the page.
    var frame = mountEl.closest('.demo-browser');
    var measuring = false;
    function fitFrame() {
      if (!frame) return;
      // On a phone the pinned grid is hidden and the cards size themselves
      // (see buildStack below), so there is no tallest scene to size for.
      if (!isPinned.matches) { frame.style.height = ''; return; }
      measuring = true;
      frame.style.height = '';
      var overflow = 0;
      for (var i = 0; i < steps.length; i++) {
        widget.setScene(i);
        var area = mountEl.querySelector('.obw-step');
        overflow = Math.max(overflow, area.scrollHeight - area.clientHeight);
      }
      if (overflow > 0) {
        frame.style.height = Math.ceil(frame.getBoundingClientRect().height + overflow) + 'px';
      }
      measuring = false;
    }
    fitFrame();

    // Phone layout: the pinned grid above is hidden, and the section is six
    // cards instead — the admin page's deck — each with the step's text
    // above its own copy of the widget, already at that step. Built once,
    // the first time the phone layout is in effect, from the desktop steps
    // so the copy lives in one place. widget.js mounts each copy. The cards
    // are sticky (styles.css); this only marks which one is on top, so the
    // ones underneath can step back — measured from the cards' boxes on each
    // scroll frame, the way panel.js does it.
    var stackEl = section.querySelector('[data-scrolly-stack]');
    var stackBuilt = false;
    function buildStack() {
      if (stackBuilt || !stackEl || !window.OrliWidget) return;
      stackBuilt = true;
      steps.forEach(function (step, i) {
        var card = document.createElement('article');
        card.className = 'scrolly-card';
        card.style.setProperty('--i', String(i));
        var cardFrame = document.createElement('div');
        cardFrame.className = 'browser demo-browser demo-browser--bare';
        var el = document.createElement('div');
        el.setAttribute('data-orli-widget', '');
        cardFrame.appendChild(el);
        var text = step.cloneNode(true);
        text.classList.add('is-active');
        text.removeAttribute('data-scene');
        card.appendChild(cardFrame);
        card.appendChild(text);
        stackEl.appendChild(card);
        var instance = window.OrliWidget.mount(el);
        if (instance) instance.setScene(i);
      });
      var cards = [].slice.call(stackEl.children);
      var onTop = -1;
      function pickTop() {
        var top = 0;
        for (var i = 0; i < cards.length; i++) {
          var r = cards[i].getBoundingClientRect();
          var stickAt = parseFloat(getComputedStyle(cards[i]).top) || 0;
          if (r.top <= stickAt + 2) top = i;
        }
        if (top === onTop) return;
        onTop = top;
        cards.forEach(function (c, idx) { c.classList.toggle('is-behind', idx < top); });
      }
      var deckTicking = false;
      window.addEventListener('scroll', function () {
        if (deckTicking || isPinned.matches) return;
        deckTicking = true;
        window.requestAnimationFrame(function () { deckTicking = false; pickTop(); });
      }, { passive: true });
      pickTop();
    }
    if (!isPinned.matches) buildStack();

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (isPinned.matches) {
          fitFrame();
          widget.setScene(current);
        } else {
          buildStack();
        }
      }, 150);
    });

    var io = null;
    var pausedTimer = null;

    function observeSteps() {
      if (!('IntersectionObserver' in window)) return;
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var i = steps.indexOf(e.target);
              if (i >= 0) activate(i);
            }
          });
        // A band across 30-40% of the viewport, not dead centre. Paired with
        // the 14vh lead-in in styles.css: step 01 has to reach this band only
        // after the widget has pinned beside it, or the step text advances
        // while the widget is still scrolling up the page. Moving the band up
        // is what let the lead-in shrink from 32vh, which is what closed the
        // gap under the section heading.
        }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
      }
      steps.forEach(function (s) { io.observe(s); });
    }

    // Scrolls the page to a step without the observer reacting to every step
    // the smooth scroll crosses on the way — that flicked the widget through
    // the whole flow. The observer is re-armed once the scroll has landed.
    function scrollToStep(i) {
      if (!isPinned.matches) return;
      if (io) io.disconnect();
      clearTimeout(pausedTimer);
      steps[i].scrollIntoView(scrollTo);
      // Re-arm once the scroll has actually stopped: a fixed delay re-armed
      // mid-flight on the long way back from step 06 to 01 (the restart),
      // and the observer then flicked the widget through every step it
      // passed. Quiet for 160ms means landed; 1500ms is the ceiling.
      var settle = null;
      var ceiling = setTimeout(rearm, 1500);
      function rearm() {
        clearTimeout(settle); clearTimeout(ceiling);
        window.removeEventListener('scroll', onMove);
        observeSteps();
      }
      function onMove() { clearTimeout(settle); settle = setTimeout(rearm, 160); }
      window.addEventListener('scroll', onMove, { passive: true });
      settle = setTimeout(rearm, 160);
      pausedTimer = ceiling;
    }

    // The visitor can also click their own way through the widget. When that
    // lands on a different step than the one we asked for, follow along in the
    // step list and bring the page to it — the sync the iframe's 'step'
    // postMessage used to provide. Scrolling keeps driving afterwards: this
    // used to hand the wheel over for good on the first click inside the
    // widget, and the steps then scrolled past a widget that no longer moved.
    // setActiveUI() has already set `current` for scene changes we drove, so
    // the echo of our own setScene() call falls out here.
    widget.onStep = function (name) {
      if (measuring) return;
      var i = SCENE_OF[name];
      if (i !== undefined && i !== current) {
        setActiveUI(i);
        scrollToStep(i);
      }
    };

    activate(0);
    observeSteps();

    // "Restart the demo" takes the page back to step 01 as well; restarting
    // while parked at step 06 otherwise leaves the observer on the step still
    // under the cursor, which snaps straight back to the success scene.
    mountEl.addEventListener('orli:restart', function () {
      setActiveUI(0);
      scrollToStep(0);
    });
  }

  // widget.js mounts on DOMContentLoaded, and its <script> tag comes first, so
  // its listener runs before this one and el.__orli exists by the time we look.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
