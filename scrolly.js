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
    function setCaption(i) {
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
    // The frame's height follows the screen's height, so a resize refits it
    // on desktop as well; the phone guard below keeps a toolbar slide out.
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
      // Desktop: the frame's height comes from the screen (styles.css), so
      // the card is scaled into it exactly as on a phone. It used to grow the
      // frame to the tallest scene instead, which is how a fixed 600px card
      // ended up on every screen, most steps filling two thirds of it.
      frame.style.height = '';
      mountEl.style.zoom = '';
      var room = frame.clientHeight;
      var over = tallestOverflow() + 6;
      mountEl.style.zoom = over > 6 ? String(room / (room + over)) : '';
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

    // ---- which step the page is on ----
    // Read straight from the page's position on every scroll, instead of
    // watching each step with an IntersectionObserver: with one full screen
    // per step and a mandatory snap, a flick crosses a whole step in one
    // frame and the observer sometimes never reported it, leaving the widget
    // a step behind (the step that "would not scroll"). Geometry cannot miss.
    var jumpTo = -1;
    var jumpTimer = null;
    var ticking = false;

    // The reading line sits at 35% down the space under the nav, where the
    // old observer's 30-40% band was: step 01 counts once the widget has
    // pinned beside it, not while it is still travelling up the page.
    function readingLine() {
      var nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      if (isNaN(nav)) nav = 65;
      return nav + (window.innerHeight - nav) * 0.35;
    }
    function stepAtLine() {
      var mid = readingLine();
      var best = -1;
      var bestDist = Infinity;
      for (var i = 0; i < steps.length; i++) {
        var r = steps[i].getBoundingClientRect();
        var d = (r.top <= mid && r.bottom >= mid) ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }
    function syncFromScroll() {
      if (measuring) return;
      var i = stepAtLine();
      if (i < 0) return;
      // While a jump we started is still travelling, ignore the steps it
      // crosses; the page landing on the target releases the driver.
      if (jumpTo >= 0) {
        if (i !== jumpTo) return;
        jumpTo = -1;
        clearTimeout(jumpTimer);
      }
      if (i !== current) activate(i);
    }
    var settleTimer = null;
    window.addEventListener('scroll', function () {
      // A snap can land the page after the last scroll event of a flick, so
      // read once more when it has been still for a moment.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(syncFromScroll, 120);
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; syncFromScroll(); });
    }, { passive: true });
    if ('onscrollend' in window) window.addEventListener('scrollend', syncFromScroll);

    // A tap in the step list, a click inside the widget, or the restart: the
    // page goes to that step and the driver waits for it to land there.
    function scrollToStep(i) {
      jumpTo = i;
      clearTimeout(jumpTimer);
      // If the page cannot reach the target (already there, or a scroll cut
      // short), release the driver rather than freezing it.
      jumpTimer = setTimeout(function () { jumpTo = -1; }, 1500);
      // On a phone the steps are invisible scroll distance under a pinned
      // block, so nothing on screen moves when the page jumps: jump at once.
      steps[i].scrollIntoView(isPinned.matches ? scrollTo : { block: 'center', behavior: 'instant' });
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
    syncFromScroll();

    // "Restart the demo" takes the page back to step 01 as well; restarting
    // while parked at step 06 otherwise leaves the page on that step, and the
    // next scroll reading snaps straight back to the success scene.
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
