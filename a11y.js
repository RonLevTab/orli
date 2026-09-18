/* ============================================================
   Accessibility menu. Builds the floating button and its panel on every
   page, applies the visitor's choices as classes on <html> (a11y.css does
   the rest), and remembers them in localStorage so the next page and the
   next visit open the way they left it.

   Deliberately ours rather than a hosted overlay: an overlay drops a
   stranger's script onto pages that carry patient contact details, cannot
   be audited, and does not survive the service going away. The settings
   are the ones the common Israeli widgets offer — text size and spacing,
   three colour modes, highlighted links and headings, a plain typeface, a
   large cursor, loud keyboard focus, motion off, reading aloud, reset.

   Loaded in <head> on every page, before the scripts that animate, so the
   stored settings are on <html> before the first paint and hero-gradient.js
   and script.js can see a11y-still and hold their own motion.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'orli-a11y';
  var root = document.documentElement;
  var MAX_TEXT = 3;
  var SIZES = [100, 112, 125, 138];

  var S = {
    title: 'נגישות',
    close: 'סגירת תפריט הנגישות',
    open: 'תפריט נגישות',
    size: 'גודל הטקסט',
    smaller: 'הקטנת טקסט',
    bigger: 'הגדלת טקסט',
    colors: 'צבעים',
    light: 'ניגודיות בהירה',
    dark: 'ניגודיות כהה',
    gray: 'גווני אפור',
    yellow: 'שחור־צהוב',
    invert: 'היפוך צבעים',
    reading: 'קריאה',
    space: 'ריווח שורות',
    links: 'הדגשת קישורים',
    headings: 'הדגשת כותרות',
    readable: 'גופן קריא',
    navigation: 'ניווט',
    cursor: 'סמן גדול',
    focus: 'הדגשת מיקוד מקלדת',
    still: 'עצירת אנימציות',
    speak: 'הקראת טקסט',
    speakNote: 'ההקראה פועלת: לחצו על כל פסקה או כותרת כדי לשמוע אותה.',
    speakNoVoice: 'הדפדפן הזה לא תומך בהקראה.',
    reset: 'איפוס הגדרות'
  };

  var FLAGS = ['space', 'links', 'headings', 'readable', 'cursor', 'focus', 'still', 'speak'];
  var MODES = ['light', 'dark', 'gray', 'yellow', 'invert'];

  var state = { text: 0, mode: '' };
  FLAGS.forEach(function (k) { state[k] = false; });

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (typeof saved.text === 'number') state.text = Math.max(0, Math.min(MAX_TEXT, saved.text));
      if (MODES.indexOf(saved.mode) >= 0) state.mode = saved.mode;
      FLAGS.forEach(function (k) { if (typeof saved[k] === 'boolean') state[k] = saved[k]; });
    } catch (e) { /* private mode, cleared storage: the defaults are fine */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* nothing to do */ }
  }

  // The classes carry every setting; a11y.css holds what each one means.
  function apply() {
    for (var i = 1; i <= MAX_TEXT; i++) root.classList.toggle('a11y-text-' + i, state.text === i);
    MODES.forEach(function (m) { root.classList.toggle('a11y-' + m, state.mode === m); });
    FLAGS.forEach(function (k) { root.classList.toggle('a11y-' + k, state[k]); });
    // Bigger or wider text needs the one-screen sections to let go, or the
    // text is cut off at the fold where it used to fit exactly.
    root.classList.toggle('a11y-loose', state.text > 0 || state.space || state.readable);
  }

  // The motion setting reaches the scripts that animate on their own: the
  // hero's WebGL gradient and the bridge film both listen for these.
  function announceMotion() {
    window.dispatchEvent(new CustomEvent(state.still ? 'orli:motion-still' : 'orli:motion-go'));
  }

  load();
  apply();

  function start() {
    if (document.querySelector('.a11y-fab')) return;

    var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none"/><path d="M4.5 8.2c2.4.9 4.9 1.3 7.5 1.3s5.1-.4 7.5-1.3"/>'
      + '<path d="M12 9.5v4.2"/><path d="M12 13.7 9.2 21"/><path d="m12 13.7 2.8 7.3"/></svg>';
    var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'a11y-fab';
    fab.setAttribute('aria-label', S.open);
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'a11yPanel');
    fab.innerHTML = icon;

    var panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11yPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'a11yTitle');
    panel.hidden = true;

    function toggleRow(key, label) {
      return '<button type="button" class="a11y-toggle" data-a11y="' + key + '" aria-pressed="false">'
        + '<span>' + label + '</span><span class="a11y-state">' + tick + '</span></button>';
    }

    panel.innerHTML =
      '<div class="a11y-head">'
        + '<h2 class="a11y-title" id="a11yTitle">' + S.title + '</h2>'
        + '<button type="button" class="a11y-close" data-a11y-close aria-label="' + S.close + '">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      + '</div>'
      + '<div class="a11y-group">'
        + '<span class="a11y-label" id="a11ySizeLabel">' + S.size + '</span>'
        + '<div class="a11y-size" role="group" aria-labelledby="a11ySizeLabel">'
          + '<button type="button" data-a11y-text="-1" aria-label="' + S.smaller + '">−</button>'
          + '<output id="a11ySizeOut">100%</output>'
          + '<button type="button" data-a11y-text="1" aria-label="' + S.bigger + '">+</button>'
        + '</div>'
      + '</div>'
      + '<div class="a11y-group">'
        + '<span class="a11y-label" id="a11yColorLabel">' + S.colors + '</span>'
        + '<div class="a11y-modes" role="group" aria-labelledby="a11yColorLabel">'
          + '<button type="button" class="a11y-mode" data-a11y-mode="light" aria-pressed="false">' + S.light + '</button>'
          + '<button type="button" class="a11y-mode" data-a11y-mode="dark" aria-pressed="false">' + S.dark + '</button>'
          + '<button type="button" class="a11y-mode" data-a11y-mode="gray" aria-pressed="false">' + S.gray + '</button>'
          + '<button type="button" class="a11y-mode" data-a11y-mode="yellow" aria-pressed="false">' + S.yellow + '</button>'
          + '<button type="button" class="a11y-mode" data-a11y-mode="invert" aria-pressed="false">' + S.invert + '</button>'
        + '</div>'
      + '</div>'
      + '<div class="a11y-group">'
        + '<span class="a11y-label">' + S.reading + '</span>'
        + toggleRow('space', S.space)
        + toggleRow('links', S.links)
        + toggleRow('headings', S.headings)
        + toggleRow('readable', S.readable)
      + '</div>'
      + '<div class="a11y-group">'
        + '<span class="a11y-label">' + S.navigation + '</span>'
        + toggleRow('cursor', S.cursor)
        + toggleRow('focus', S.focus)
        + toggleRow('still', S.still)
        + toggleRow('speak', S.speak)
        + '<p class="a11y-note" id="a11yNote" hidden></p>'
      + '</div>'
      + '<button type="button" class="a11y-reset" data-a11y-reset>' + S.reset + '</button>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var note = panel.querySelector('#a11yNote');
    var sizeOut = panel.querySelector('#a11ySizeOut');
    var canSpeak = 'speechSynthesis' in window;

    function paint() {
      sizeOut.textContent = SIZES[state.text] + '%';
      panel.querySelectorAll('[data-a11y]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(!!state[b.getAttribute('data-a11y')]));
      });
      panel.querySelectorAll('[data-a11y-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(state.mode === b.getAttribute('data-a11y-mode')));
      });
      if (state.speak) {
        note.hidden = false;
        note.textContent = canSpeak ? S.speakNote : S.speakNoVoice;
      } else {
        note.hidden = true;
      }
    }

    function setOpen(open) {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', String(open));
      if (open) {
        paint();
        var first = panel.querySelector('button');
        if (first) first.focus();
      }
    }

    fab.addEventListener('click', function () { setOpen(panel.hidden); });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-a11y-close]')) { setOpen(false); fab.focus(); return; }

      var step = e.target.closest('[data-a11y-text]');
      if (step) {
        state.text = Math.max(0, Math.min(MAX_TEXT, state.text + Number(step.getAttribute('data-a11y-text'))));
        apply(); save(); paint();
        return;
      }

      // One colour mode at a time, and pressing the current one turns it off.
      var mode = e.target.closest('[data-a11y-mode]');
      if (mode) {
        var name = mode.getAttribute('data-a11y-mode');
        state.mode = state.mode === name ? '' : name;
        apply(); save(); paint();
        return;
      }

      var toggle = e.target.closest('[data-a11y]');
      if (toggle) {
        var key = toggle.getAttribute('data-a11y');
        state[key] = !state[key];
        apply(); save(); paint();
        if (key === 'still') announceMotion();
        if (key === 'speak' && !state.speak && canSpeak) window.speechSynthesis.cancel();
        return;
      }

      if (e.target.closest('[data-a11y-reset]')) {
        if (canSpeak) window.speechSynthesis.cancel();
        state = { text: 0, mode: '' };
        FLAGS.forEach(function (k) { state[k] = false; });
        apply(); save(); paint(); announceMotion();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!panel.hidden) { setOpen(false); fab.focus(); }
      else if (state.speak && canSpeak) window.speechSynthesis.cancel();
    });

    // Outside the panel, a click closes it — but never the click that opened it.
    document.addEventListener('click', function (e) {
      if (panel.hidden) return;
      if (panel.contains(e.target) || fab.contains(e.target)) return;
      setOpen(false);
    });

    // ---- reading aloud ----
    // While the setting is on, a click in the page reads the piece of text it
    // landed on. Links and buttons are left to do their own job: a visitor who
    // taps "book a demo" wants the demo, not a recital.
    var reading = null;
    document.addEventListener('click', function (e) {
      if (!state.speak || !canSpeak) return;
      if (panel.contains(e.target) || fab.contains(e.target)) return;
      if (e.target.closest('a, button, input, textarea, select, [role="button"]')) return;
      var block = e.target.closest('p, h1, h2, h3, h4, li, dd, dt, blockquote, figcaption, .lead, .section-lead');
      if (!block) return;
      var text = (block.innerText || '').trim();
      if (!text) return;
      window.speechSynthesis.cancel();
      if (reading) reading.classList.remove('a11y-reading');
      reading = block;
      block.classList.add('a11y-reading');
      var say = new SpeechSynthesisUtterance(text);
      say.lang = root.lang || 'he';
      say.rate = 0.95;
      say.onend = say.onerror = function () {
        block.classList.remove('a11y-reading');
        if (reading === block) reading = null;
      };
      window.speechSynthesis.speak(say);
    });

    // A page left mid-sentence should not keep talking on the next one.
    window.addEventListener('pagehide', function () { if (canSpeak) window.speechSynthesis.cancel(); });

    paint();
    // The scripts that animate start after this one; tell them where the
    // motion setting stands once they are listening.
    window.addEventListener('load', announceMotion);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
