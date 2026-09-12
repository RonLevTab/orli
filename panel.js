/* ============================================================
   Drives the vertical tabs on panel.html from the page's scroll.

   A port of a 21st.dev "VerticalTabs" React component (useState +
   motion/react) into plain JS. One state, the active index, and one
   direction (+1 forward, -1 back) that decides which edge the next pane
   slides in from: forward, the new pane enters from below and the old
   leaves upward; back, the reverse — the component's `variants`.

   The component advanced on a clock. Here the visitor's scroll is the
   clock: the whole block (tabs and panel) pins under the nav while an
   invisible track of one spacer per screen (.ptabs-stop, panel.html)
   scrolls under it, and how far the track has gone picks the screen —
   the same mechanism as the booking demo on the home page. Reaching the
   end of the track lets the page go on. The thin rule beside the active
   tab fills with the visitor's progress through that screen's stretch
   of track; the rules of screens already passed stay full.

   - Clicking a tab (or the panel, for the next screen) scrolls the page
     to that screen's stretch of track — at once on phones, smoothly on
     wide screens with the scroll driver ignoring the screens crossed on
     the way, so the panel does not flick through them.
   - .is-played is added to a pane the first time it is shown and never
     removed; panel.css keys each mock's one-shot control animation on it.

   Deliberately not sharing scrolly.js: that file drives the booking
   widget through an IntersectionObserver and a controller handle; this
   one needs a continuous position, not just a step.
   ============================================================ */
(function () {
  'use strict';

  function start() {
    var root = document.querySelector('[data-ptabs]');
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('.ptab'));
    var panes = [].slice.call(root.querySelectorAll('.ptabs-pane'));
    var panel = root.querySelector('[data-ptabs-panel]');
    var section = root.closest('section') || root.parentElement;
    var track = section.querySelector('[data-ptabs-track]');
    if (!tabs.length || tabs.length !== panes.length || !panel) return;

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var phone = window.matchMedia('(max-width: 920px)');
    var count = tabs.length;
    var active = 0;

    // The rule beside the active tab: how far through its stretch of
    // track the visitor is. Passed tabs are full by CSS (.is-done), the
    // ones ahead empty, so only the active one carries an inline value.
    function setFill(frac) {
      var bar = tabs[active].querySelector('.ptab-progress');
      if (bar) bar.style.transform = 'scaleY(' + frac.toFixed(3) + ')';
    }

    function show(next, direction) {
      if (next === active) return;
      var prev = active;
      active = next;
      // Same way as the list beside it: forward, the new screen comes up
      // from below and the old one leaves upward; back, the reverse.
      var from = direction > 0 ? '100%' : '-100%';
      var to = direction > 0 ? '-100%' : '100%';

      tabs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === next);
        t.classList.toggle('is-done', i < next);
        if (i === next) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
        if (i !== next) {
          var bar = t.querySelector('.ptab-progress');
          if (bar) bar.style.transform = '';
        }
      });
      rollTo();

      panes.forEach(function (p, i) {
        p.classList.remove('is-leaving');
        if (i === prev) {
          p.style.setProperty('--pane-to', to);
          p.classList.remove('is-active');
          if (!still) p.classList.add('is-leaving');
        } else if (i === next) {
          p.style.setProperty('--pane-from', from);
          // Let the start position land before the transition to centre.
          void p.offsetHeight;
          p.classList.add('is-active', 'is-played');
        } else {
          p.classList.remove('is-active');
        }
      });
      panes[prev].addEventListener('transitionend', function done() {
        panes[prev].removeEventListener('transitionend', done);
        panes[prev].classList.remove('is-leaving');
      });
    }

    // The roller: bring the active screen to the middle of the box. Once
    // at the change, and again when the descriptions have finished
    // folding, since the tabs above shift by the folded height.
    var roller = root.querySelector('.ptabs-roller');
    var list = root.querySelector('.ptabs-list');
    var centerTimer = null;
    function centerList() {
      if (!roller || !list) return;
      var tab = tabs[active];
      var y = tab.offsetTop + tab.offsetHeight / 2 - roller.clientHeight / 2;
      list.style.transform = 'translateY(' + (-Math.round(y)) + 'px)';
    }
    function rollTo() {
      clearTimeout(centerTimer);
      centerList();
      centerTimer = setTimeout(centerList, 340);
    }

    // ---- the scroll driver ----
    // Where the block pins: under the nav with a little air, or lower on
    // a tall screen so the block sits at the middle rather than hanging
    // from the top. Set on the element so CSS and this file agree.
    var pinTop = 0;
    var navH = 65;
    function placePin() {
      navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 65;
      var air = phone.matches ? 8 : 22;
      var centred = (window.innerHeight - root.offsetHeight) / 2;
      pinTop = Math.max(navH + air, phone.matches ? 0 : Math.round(centred));
      root.style.top = pinTop + 'px';
    }

    // On a phone the frame is shorter than the tallest mock can be, and
    // nothing scrolls inside it (panel.css), so the mocks are zoomed down
    // together until the tallest fits; one zoom for all, so the frame
    // does not resize between screens.
    var mocks = panes.map(function (p) { return p.querySelector('.orli-panel'); });
    function fitMocks() {
      mocks.forEach(function (m) { if (m) m.style.zoom = ''; });
      if (!phone.matches) return;
      var pad = parseFloat(getComputedStyle(panes[0]).paddingTop) || 0;
      var room = panel.clientHeight - pad * 2;
      var tallest = 0;
      mocks.forEach(function (m) { if (m) tallest = Math.max(tallest, m.offsetHeight); });
      if (tallest > room && room > 0) {
        var zoom = String(room / tallest);
        mocks.forEach(function (m) { if (m) m.style.zoom = zoom; });
      }
    }

    // Where the track begins relative to the pinned block: on wide screens
    // the track follows the block in flow, so a screen starts as the
    // block's bottom passes it; on a phone the track shares the block's
    // cell (panel.css) and starts at the block's own top.
    function origin() {
      return phone.matches ? pinTop : pinTop + root.offsetHeight;
    }

    // The track's position under the pinned block, in screens: 0 the
    // moment the block pins, 1 one spacer later, and so on. Before the
    // block has pinned this is negative, past the track it is beyond
    // count; both clamp to the first and last screen.
    function position() {
      var r = track.getBoundingClientRect();
      var stop = r.height / count;
      if (!stop) return 0;
      return (origin() - r.top) / stop;
    }

    // A tab click scrolls the page to that screen's stretch of track. The
    // driver shows the target at once and ignores the screens the smooth
    // scroll crosses, until the page lands on it; if the visitor cuts the
    // scroll short, the ceiling releases the driver where the page is.
    var jumping = -1;
    var jumpTimer = null;
    function scrollToStep(i) {
      i = Math.max(0, Math.min(count - 1, i));
      if (!track) { show(i, i > active ? 1 : -1); return; }
      var r = track.getBoundingClientRect();
      var stop = r.height / count;
      // A little way into the screen's stretch on wide screens; on a phone
      // exactly the spacer's snap position (its top under the nav).
      var lead = phone.matches ? pinTop - navH : 0.12 * stop;
      var target = window.scrollY + (r.top - origin()) + i * stop + lead;
      show(i, i > active ? 1 : -1);
      setFill(0.12);
      jumping = i;
      clearTimeout(jumpTimer);
      var instant = still || phone.matches;
      // 'instant', not 'auto': auto takes the page's own smooth scrolling
      // (styles.css), and the short settle timer below then released the
      // driver while the page was still moving.
      window.scrollTo({ top: Math.round(target), behavior: instant ? 'instant' : 'smooth' });
      jumpTimer = setTimeout(function () { jumping = -1; onScroll(); }, instant ? 80 : 1500);
    }

    function onScroll() {
      if (!track) return;
      var v = position();
      var i = Math.max(0, Math.min(count - 1, Math.floor(v)));
      var frac = Math.max(0, Math.min(1, v - i));
      if (jumping >= 0) {
        if (i !== jumping) return;
        jumping = -1;
        clearTimeout(jumpTimer);
      }
      if (i !== active) show(i, i > active ? 1 : -1);
      setFill(frac);
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; onScroll(); });
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        placePin();
        // A phone's toolbar sliding away fires resize too; refitting the
        // mocks then would make them jump mid-scroll, so a phone refits
        // only when its width changes (a rotation).
        if (phone.matches ? window.innerWidth !== fittedWidth : true) { fittedWidth = window.innerWidth; fitMocks(); }
        centerList();
        onScroll();
      }, 150);
    });

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        if (i === active) return;
        scrollToStep(i);
      });
    });
    panel.addEventListener('click', function () {
      if (active < count - 1) scrollToStep(active + 1);
    });

    // Initial state: the first pane is already active in the markup; its
    // control plays now. The driver then takes the page's position.
    tabs[0].classList.add('is-active');
    panes[0].classList.add('is-played');
    var fittedWidth = window.innerWidth;
    placePin();
    fitMocks();
    rollTo();
    onScroll();
    // Fonts and images settle the block's height a moment after load.
    window.addEventListener('load', function () { placePin(); fitMocks(); centerList(); onScroll(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
