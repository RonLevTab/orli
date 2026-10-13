(function () {
  'use strict';
  // The films on features.html ([data-film]). Each is one frame that plays
  // its scene while mostly on screen, holds the last picture for a beat,
  // then plays again; scrolling away stops and clears it, so coming back
  // always starts at the first beat. Same rules as the home page's journey
  // film in script.js: under prefers-reduced-motion or the accessibility
  // menu's "motion off" (a11y.js, orli:motion-still) the frame shows the
  // finished picture once; motion on again restarts it.
  //
  // A film is a list of beats: [ms, fn]. `settle` is the finished picture,
  // `reset` clears every class the beats add. Everything a beat does is a
  // class on the film root or on one element, so films.css owns the look.

  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function countUp(el, to, ms) {
    var start = null;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * e)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (p < 1) el._raf = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(el._raf);
    el._raf = requestAnimationFrame(tick);
  }

  var FILMS = {
    // Orli says hello, the patient asks, Orli answers from the clinic's
    // approved facts and offers the day's free times; a time is taken and
    // the booking lands. Each of her lines waits behind typing dots about
    // as long as the words would take to write.
    chat: function (root) {
      var msgs = Array.prototype.slice.call(root.querySelectorAll('.fc-msg'));
      var beats = [];
      var t = 900;
      msgs.forEach(function (m, i) {
        var bot = m.classList.contains('bot');
        var words = m.textContent.trim().split(/\s+/).length;
        if (bot) {
          beats.push([t, function () { root.classList.add('is-typing'); }]);
          t += Math.min(2200, 500 + words * 55);
          beats.push([t, function () { root.classList.remove('is-typing'); m.classList.add('is-in'); }]);
        } else {
          t += 600;
          beats.push([t, function () { m.classList.add('is-in'); }]);
        }
        if (m.hasAttribute('data-pick-after')) {
          t += 1400;
          beats.push([t, function () { root.classList.add('is-picked'); }]);
        }
        t += bot ? 900 : 300;
      });
      return {
        beats: beats,
        hold: 3200,
        reset: function () { root.classList.remove('is-typing', 'is-picked'); msgs.forEach(function (m) { m.classList.remove('is-in'); }); },
        settle: function () { root.classList.remove('is-typing'); root.classList.add('is-picked'); msgs.forEach(function (m) { m.classList.add('is-in'); }); }
      };
    },

    // A visit ends, the months pass on the rail, the clinic's own email
    // arrives with one button, a tap, the booking panel with the treatment
    // already chosen, a time, booked.
    remind: function (root) {
      var mail = root.querySelector('.fr-mail');
      var btn = root.querySelector('.fr-btn');
      var fill = root.querySelector('.fr-rail-fill');
      return {
        beats: [
          [800, function () { root.classList.add('is-b1'); }],
          [1500, function () { root.classList.add('is-b2'); }],
          [4300, function () { root.classList.add('is-b3'); mail.classList.add('is-in'); }],
          [6200, function () { root.classList.add('is-b4'); btn.classList.add('is-tapping'); }],
          [6900, function () { root.classList.add('is-b5'); }],
          [8500, function () { root.classList.add('is-b6'); }],
          [9700, function () { root.classList.add('is-b7'); }]
        ],
        hold: 3000,
        reset: function () {
          root.classList.remove('is-b1', 'is-b2', 'is-b3', 'is-b4', 'is-b5', 'is-b6', 'is-b7');
          mail.classList.remove('is-in'); btn.classList.remove('is-tapping');
          // Restart the rail from empty without a backwards sweep.
          fill.style.transition = 'none'; void fill.offsetWidth; fill.style.transition = '';
        },
        settle: function () { root.classList.add('is-b1', 'is-b2', 'is-b3', 'is-b5', 'is-b6', 'is-b7'); mail.classList.add('is-in'); }
      };
    },

    // The month's tiles count up, the days' bars rise one after another,
    // then the comparison with the month before and the average line.
    stats: function (root) {
      var vals = Array.prototype.slice.call(root.querySelectorAll('[data-count]'));
      var bars = Array.prototype.slice.call(root.querySelectorAll('.fs-bars i'));
      bars.forEach(function (b, i) { b.style.transitionDelay = (i * 60) + 'ms'; });
      return {
        beats: [
          [700, function () { root.classList.add('is-b1'); vals.forEach(function (v) { countUp(v, +v.getAttribute('data-count'), 1300); }); }],
          [1500, function () { root.classList.add('is-b2'); }],
          [3200, function () { root.classList.add('is-b3'); }]
        ],
        hold: 3200,
        reset: function () {
          root.classList.remove('is-b1', 'is-b2', 'is-b3');
          vals.forEach(function (v) { cancelAnimationFrame(v._raf); v.textContent = '0'; });
          bars.forEach(function (b) { b.style.transition = 'none'; });
          void root.offsetWidth;
          bars.forEach(function (b) { b.style.transition = ''; });
        },
        settle: function () {
          root.classList.add('is-b1', 'is-b2', 'is-b3');
          vals.forEach(function (v) { v.textContent = String(+v.getAttribute('data-count')).replace(/\B(?=(\d{3})+(?!\d))/g, ','); });
        }
      };
    },

    // Optima stops answering: the dot turns red, a booking made meanwhile
    // waits in the calendar with its mark, the patient is told nothing but
    // "booked"; Optima is back, the booking is written and the mark goes.
    outage: function (root) {
      return {
        beats: [
          [1200, function () { root.classList.add('is-down', 'is-b1'); }],
          [2600, function () { root.classList.add('is-b2'); }],
          [3600, function () { root.classList.add('is-b3'); }],
          [6400, function () { root.classList.remove('is-down'); root.classList.add('is-b4'); }],
          [7300, function () { root.classList.add('is-b5'); }]
        ],
        hold: 3200,
        reset: function () { root.classList.remove('is-down', 'is-b1', 'is-b2', 'is-b3', 'is-b4', 'is-b5'); },
        settle: function () { root.classList.add('is-b2', 'is-b3', 'is-b4', 'is-b5'); }
      };
    }
  };

  function mount(root) {
    var make = FILMS[root.getAttribute('data-film')];
    if (!make) return;
    var film = make(root);
    var timers = [];
    var visible = false;
    var playing = false;
    var after = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    function stop() { timers.forEach(clearTimeout); timers = []; playing = false; film.reset(); }
    function play() {
      if (playing) return;
      playing = true;
      var last = 0;
      film.beats.forEach(function (b) { after(b[0], b[1]); last = Math.max(last, b[0]); });
      after(last + film.hold, function () {
        film.reset();
        playing = false;
        if (visible) after(700, play);
      });
    }
    function settle() { stop(); film.settle(); root.classList.add('is-done'); }

    window.addEventListener('orli:motion-still', settle);
    window.addEventListener('orli:motion-go', function () {
      if (still.matches) return;
      root.classList.remove('is-done');
      stop();
      if (visible) play();
    });

    if (still.matches || document.documentElement.classList.contains('a11y-still')) {
      settle();
    } else if ('IntersectionObserver' in window) {
      var need = Math.min(0.6, Math.max(0.2, (window.innerHeight * 0.7) / Math.max(1, root.offsetHeight)));
      // Leaving is debounced: a resize or an address bar sliding away can
      // report the film gone and back within a frame, which would restart
      // it mid-scene for no reason the viewer can see.
      var leaving = null;
      var io = new IntersectionObserver(function (entries) {
        visible = entries.some(function (e) { return e.isIntersecting; });
        clearTimeout(leaving);
        if (!visible) { leaving = setTimeout(stop, 300); return; }
        if (!playing) play();
      }, { threshold: need });
      io.observe(root);
    } else {
      play();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-film]'), mount);

  // The chapter links under the title: the one whose chapter is on screen
  // is marked, so the row doubles as a progress line down the page.
  var links = Array.prototype.slice.call(document.querySelectorAll('.chapter-nav a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-here'); });
        var a = byId[e.target.id]; if (a) a.classList.add('is-here');
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) seen.observe(el); });
  }
})();
