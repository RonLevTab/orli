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

    // Size the card to the tallest scene, so no step ever scrolls inside it.
    // The real widget's fixed 580px frame is already short of its own confirm
    // step (see styles.css), and a narrow column or a fallback font wraps the
    // patient and confirm steps taller still — so this is measured, not
    // guessed: every scene is rendered once, the step area's overflow taken,
    // and the card grows past its CSS height by the largest. Runs before
    // onStep is wired, so the measuring renders don't drive the page.
    var frame = mountEl.closest('.demo-browser');
    var measuring = false;
    var released = false;
    function fitFrame() {
      if (!frame) return;
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

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // Once the visitor has taken over, re-measuring would throw away
        // whatever they typed; the card keeps the height it has.
        if (released) return;
        fitFrame();
        widget.setScene(current);
      }, 150);
    });

    // The visitor can also click their own way through the widget. When that
    // lands on a different step than the one we asked for, follow along in the
    // step list — the sync the iframe's 'step' postMessage used to provide.
    // setActiveUI() has already set `current` for scene changes we drove, so
    // the echo of our own setScene() call falls out here.
    widget.onStep = function (name) {
      if (measuring) return;
      var i = SCENE_OF[name];
      if (i !== undefined && i !== current) {
        setActiveUI(i);
        if (isPinned.matches) steps[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    activate(0);

    var io = null;

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
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      }
      steps.forEach(function (s) { io.observe(s); });
      released = false;
    }

    // The scroll narrative is for passive readers. index.html invites the
    // visitor to drive it themselves ("נסו את התוסף בעצמכם"), and a scroll
    // nudge used to call setScene() -> reset() and throw away whatever they
    // had typed. So the first real touch inside the widget hands over control:
    // the observer stops, and widget.onStep (wired above) keeps the step list
    // following them instead of leading them. The numbered tabs still work —
    // clicking one is an explicit request to jump, not an accident of scroll.
    function release() {
      if (released) return;
      released = true;
      if (io) io.disconnect();
    }

    observeSteps();

    ['pointerdown', 'keydown'].forEach(function (evt) {
      mountEl.addEventListener(evt, release);
    });

    // "Restart the demo" is the one control that hands the wheel back, so it
    // has to undo the release its own pointerdown just caused — otherwise the
    // widget resets to the first step and then sits there, deaf to scrolling.
    mountEl.addEventListener('orli:restart', function () {
      setActiveUI(0);
      if (isPinned.matches) {
        // Take the page back to step 01 as well; restarting the demo while
        // parked at step 06 otherwise re-arms onto the step still under the
        // cursor and snaps straight back to the success scene.
        steps[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Re-observe only once that scroll has landed. Doing it immediately
        // would fire the observer for every step the smooth scroll passes
        // through, flicking the widget backwards through the whole flow.
        setTimeout(observeSteps, 700);
      } else {
        observeSteps();
      }
    });
  }

  // widget.js mounts on DOMContentLoaded, and its <script> tag comes first, so
  // its listener runs before this one and el.__orli exists by the time we look.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
