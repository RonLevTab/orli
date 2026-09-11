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
    // Below this breakpoint the widget and its caption are pinned in one
    // block under the nav and the step list is invisible scroll distance
    // (see styles.css); the same observer drives both layouts. The
    // difference is only in sizing: the desktop frame is measured to the
    // tallest scene, the phone frame takes the screen.
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
    // On a phone all six steps sit in one short list above the widget
    // (styles.css hides the step list there and turns it into scroll
    // distance). The list is built once from the steps; each change opens
    // the current step's text and ticks the ones passed. The list has one
    // fixed height, so the widget under it never moves between steps.
    var caption = section.querySelector('[data-scrolly-caption]');
    var capItems = [];
    if (caption) {
      steps.forEach(function (step, i) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'scrolly-cap';
        item.innerHTML =
          '<span class="scrolly-cap-n" aria-hidden="true"><span class="scrolly-cap-num"></span>' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5l2.3 2.3L9.5 3.8"/></svg></span>' +
          '<span class="scrolly-cap-body"><span class="scrolly-cap-t"></span>' +
          '<span class="scrolly-cap-d"><span class="scrolly-cap-p"></span></span></span>';
        item.querySelector('.scrolly-cap-num').textContent = String(i + 1);
        item.querySelector('.scrolly-cap-t').textContent = step.querySelector('h3').textContent;
        item.querySelector('.scrolly-cap-p').textContent = step.querySelector('p').textContent;
        item.addEventListener('click', function () {
          if (i === current) return;
          activate(i);
          scrollToStep(i);
        });
        caption.appendChild(item);
        capItems.push(item);
      });
    }
    // The last step's door to the conversion (index.html .step-cta): on a
    // phone the step text is invisible scroll distance, so the link moves
    // into the pinned block and shows over the card's foot on that step.
    var stepCta = section.querySelector('.scrolly-step .step-cta');
    var ctaHome = stepCta ? stepCta.parentNode : null;
    var sticky = section.querySelector('.scrolly-sticky');
    function placeCta() {
      if (!stepCta || !sticky) return;
      if (isPinned.matches) {
        stepCta.classList.remove('scrolly-cta', 'is-shown');
        if (stepCta.parentNode !== ctaHome) ctaHome.appendChild(stepCta);
      } else {
        stepCta.classList.add('scrolly-cta');
        if (stepCta.parentNode !== sticky) sticky.appendChild(stepCta);
      }
    }
    placeCta();
    if (isPinned.addEventListener) isPinned.addEventListener('change', placeCta);

    function setCaption(i) {
      if (stepCta) stepCta.classList.toggle('is-shown', !isPinned.matches && i === steps.length - 1);
      capItems.forEach(function (item, k) {
        item.classList.toggle('is-done', k < i);
        item.classList.toggle('is-active', k === i);
        if (k === i) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
    }

    function setActiveUI(i) {
      current = i;
      steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      tabs.forEach(function (t, idx) {
        t.classList.toggle('is-active', idx === i);
        if (idx === i) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
      });
      setCaption(i);
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
    function tallestOverflow() {
      var overflow = 0;
      for (var i = 0; i < steps.length; i++) {
        widget.setScene(i);
        var area = mountEl.querySelector('.obw-step');
        overflow = Math.max(overflow, area.scrollHeight - area.clientHeight);
      }
      return overflow;
    }
    function fitFrame() {
      if (!frame) return;
      measuring = true;
      if (!isPinned.matches) {
        // A phone has less room than the card is drawn for (styles.css caps
        // the frame under the caption). The card fills that room, and the
        // whole card is zoomed down until its tallest step fits inside it
        // rather than scrolling: at zoom z the card is laid out room / z
        // tall (and wider, which only helps), so the overflow measured at
        // zoom 1 is exactly what the zoom has to absorb.
        frame.style.height = '';
        mountEl.style.zoom = '';
        var room = parseFloat(getComputedStyle(frame).maxHeight);
        if (!(room > 0)) room = frame.clientHeight;
        frame.style.height = room + 'px';
        // Nothing scrolls inside the card on a phone (styles.css hides the
        // overflow), so a few px of slack keep a rounding or a slightly
        // different font from clipping the confirm button.
        var over = tallestOverflow() + 6;
        mountEl.style.zoom = String(room / (room + over));
        measuring = false;
        return;
      }
      mountEl.style.zoom = '';
      frame.style.height = '';
      var overflow = tallestOverflow();
      if (overflow > 0) {
        frame.style.height = Math.ceil(frame.getBoundingClientRect().height + overflow) + 'px';
      }
      measuring = false;
    }
    fitFrame();
    // The card was measured in the fallback font; Heebo lands a moment
    // later with its own metrics, so measure once more when it is in.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fitFrame();
        widget.setScene(current < 0 ? 0 : current);
      });
    }

    var resizeTimer = null;
    var fittedWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // A phone's toolbar sliding away fires resize too; refitting the
        // card then would make it jump mid-scroll, so a phone refits only
        // when its width changes (a rotation).
        if (!isPinned.matches && window.innerWidth === fittedWidth) return;
        fittedWidth = window.innerWidth;
        fitFrame();
        widget.setScene(current);
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
      if (io) io.disconnect();
      clearTimeout(pausedTimer);
      // On a phone the step list is invisible scroll distance under a pinned
      // block, so nothing on screen moves when the page jumps: jump at once
      // and re-arm on the next frame. A smooth scroll here could be cut
      // short by the visitor's own touch, and the observer then re-armed
      // onto the old spacer and snapped the widget back to the old step.
      if (!isPinned.matches) {
        steps[i].scrollIntoView({ block: 'center', behavior: 'instant' });
        pausedTimer = setTimeout(observeSteps, 50);
        return;
      }
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
