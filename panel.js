/* ============================================================
   Drives the vertical tabs on panel.html.

   A port of a 21st.dev "VerticalTabs" React component (useState +
   motion/react) into plain JS. One state, the active index, and one
   direction (+1 forward, -1 back) that decides which edge the next pane
   slides in from: forward, the new pane enters from the top and the old
   leaves by the bottom; back, the reverse — the component's `variants`.

   - Autoplay: every AUTO_PLAY_DURATION the panel advances and wraps.
     Hovering the panel pauses it (and empties the progress rule), leaving
     resumes; clicking a tab jumps there and un-pauses; the arrows and a
     click on the panel itself step it. Reduced motion: no autoplay at
     all, the visitor drives it.
   - The progress rule beside the active tab is a CSS transform transition
     of AUTO_PLAY_DURATION; it is restarted from zero on every activation.
   - .is-played is added to a pane the first time it is shown and never
     removed; panel.css keys each mock's one-shot control animation on it.

   Deliberately not sharing scrolly.js: that file drives the booking
   widget from the page's scroll; nothing here scrolls.
   ============================================================ */
(function () {
  'use strict';

  var AUTO_PLAY_DURATION = 5000;

  function start() {
    var root = document.querySelector('[data-ptabs]');
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('.ptab'));
    var panes = [].slice.call(root.querySelectorAll('.ptabs-pane'));
    var panel = root.querySelector('[data-ptabs-panel]');
    if (!tabs.length || tabs.length !== panes.length || !panel) return;

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var count = tabs.length;
    var active = 0;
    var paused = false;
    // Once the visitor has picked a screen, the panel stops running on its
    // own: they are reading, not watching.
    var manual = false;
    var timer = null;

    function restartClock(tab) {
      var bar = tab.querySelector('.ptab-progress');
      if (!bar) return;
      // Back to zero without a transition, then let the CSS transition
      // (AUTO_PLAY_DURATION, linear) carry it to full.
      tab.classList.remove('is-running', 'is-paused', 'is-done');
      // Picked by hand: the line shows full, and the clock does not run.
      if (manual) { tab.classList.add('is-done'); return; }
      tab.classList.toggle('is-paused', paused);
      void bar.offsetHeight;
      if (!paused && !still) tab.classList.add('is-running');
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
        if (i === next) t.setAttribute('aria-current', 'step');
        else t.removeAttribute('aria-current');
        if (i !== next) t.classList.remove('is-running', 'is-paused');
      });
      restartClock(tabs[next]);
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
      schedule();
    }

    function goNext() { show((active + 1) % count, 1); }
    function goPrev() { show((active - 1 + count) % count, -1); }

    // The React effect: a fresh interval after every change, none while
    // paused. Under reduced motion the panel never moves on its own.
    function schedule() {
      clearInterval(timer);
      timer = null;
      if (paused || still) return;
      timer = setInterval(goNext, AUTO_PLAY_DURATION);
    }

    function setPaused(state) {
      if (paused === state) return;
      paused = state;
      restartClock(tabs[active]);
      schedule();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        if (i === active) return;
        var direction = i > active ? 1 : -1;
        manual = true;
        paused = true;
        show(i, direction);
      });
    });
    panel.addEventListener('click', function () { manual = true; paused = true; goNext(); });
    panel.addEventListener('mouseenter', function () { setPaused(true); });
    panel.addEventListener('mouseleave', function () { if (!manual) setPaused(false); });

    // Not worth advancing in a background tab; pick up where it left off.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearInterval(timer); timer = null; }
      else { restartClock(tabs[active]); schedule(); }
    });

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
    var rollResize = null;
    window.addEventListener('resize', function () {
      clearTimeout(rollResize);
      rollResize = setTimeout(centerList, 150);
    });

    // Initial state: the first pane is already active in the markup; its
    // control plays now, and the clock starts.
    tabs[0].classList.add('is-active');
    panes[0].classList.add('is-played');
    rollTo();
    restartClock(tabs[0]);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
