/* ============================================================
   Drives the stack of screen cards on panel.html.

   The cards are sticky (panel.css), so the browser does the stacking on
   its own. This only answers two questions the stylesheet cannot:

   1. Which card is on top right now? Everything before it is marked
      .is-behind (covered in full by the card on top). Measured from the
      cards' own boxes on each scroll frame — a card is "reached" once it
      has climbed to its sticky offset — because an observer only reports
      crossings, and a scroll that crosses nothing left the stack stale.

   2. Has a card been reached for the first time? .is-played is added once
      and never removed, and panel.css keys each mock's one-shot control
      animation on it, so a control plays when its screen first comes up
      and stays settled on the way back.

   Below 921px the cards sit in normal flow (no stacking), so only the
   second question applies, and an IntersectionObserver answers it.

   Deliberately not sharing scrolly.js: that file drives the booking
   widget through a controller handle and hands control to the visitor on
   first touch — none of which exists here.
   ============================================================ */
(function () {
  'use strict';

  function start() {
    var stack = document.querySelector('[data-pstack]');
    if (!stack) return;
    var cards = [].slice.call(stack.querySelectorAll('.pcard'));
    if (!cards.length) return;

    var isStacked = window.matchMedia('(min-width: 921px)');

    function play(card) {
      if (!card.classList.contains('is-played')) card.classList.add('is-played');
    }

    var active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      cards.forEach(function (c, idx) {
        c.classList.toggle('is-active', idx === i);
        c.classList.toggle('is-behind', idx < i);
      });
      play(cards[i]);
    }

    // A card has been reached when its top has climbed to (or past) the
    // offset it sticks at; the last such card is the one on top.
    var ticking = false;
    function pick() {
      ticking = false;
      if (!isStacked.matches) return;
      var top = 0;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        var stickAt = parseFloat(getComputedStyle(cards[i]).top) || 0;
        if (r.top <= stickAt + 2) top = i;
      }
      setActive(top);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(pick);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // In flow (phones), and as a second trigger when stacked: a card that
    // comes well into view has been seen, so its control plays.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (isStacked.matches) onScroll(); else play(e.target);
        });
      }, { threshold: 0.35 });
      cards.forEach(function (c) { io.observe(c); });
    } else {
      cards.forEach(play);
    }

    // Leaving the stacked layout: nothing is "behind" in a single column.
    isStacked.addEventListener('change', function () {
      if (!isStacked.matches) {
        active = -1;
        cards.forEach(function (c) { c.classList.remove('is-active', 'is-behind'); });
      } else {
        onScroll();
      }
    });

    pick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
