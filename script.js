(function () {
  'use strict';

  // Current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Demo request form (front-end only; wires to a real endpoint later).
  // Only present on index.html — guarded so this file can be shared as-is
  // across the secondary pages (about/integration/privacy), which just need
  // the footer year and, on integration.html, the reveal-on-scroll below.
  const form = document.getElementById('demoForm');
  if (form) {
    const note = document.getElementById('formNote');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const clinic = form.clinic.value.trim();
      const email = form.email.value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!clinic || !validEmail) {
        note.classList.add('is-error');
        note.textContent = 'נא למלא שם מרפאה ואימייל תקין.';
        return;
      }
      note.classList.remove('is-error');
      note.textContent = `תודה. ניצור קשר עם ${clinic} בכתובת ${email} כדי לקבוע הדגמה.`;
      form.reset();
    });
  }

  // Reveal-on-scroll: headlines, eyebrows, leads and list items are split
  // into words, then the words are grouped by which visual line they land
  // on so a whole line fades + rises in together — a slower, calmer
  // cascade than revealing word-by-word. Headline words additionally
  // blur in, for a touch more presence on the big text. Composite,
  // non-prose elements (cards, tables, dividers) still fade+rise as a
  // single block. The hero is excluded — it has its own on-load fade-in
  // since it's visible immediately and scroll can't trigger it.
  //
  // The hidden state lives in CSS (gated behind the `.js` class an inline
  // script in <head> adds before first paint — see styles.css), not here.
  // That's what makes this a single clean reveal instead of a flash of
  // full-clarity text that then jumps to hidden right as this script runs.
  const lineRevealTargets = document.querySelectorAll([
    '.section .display',
    ':is(.section, .cta-band) .eyebrow',
    '.section-lead', '.cta-lead', '.ladder-note', '.check-list li',
  ].join(', '));
  const blockRevealTargets = document.querySelectorAll([
    '.rung', '.code-card', '.cmp-table', '.swatches', '.notice-banner', '.section-divider',
  ].join(', '));

  if ('IntersectionObserver' in window) {
    function splitIntoWords(el) {
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (part === '') return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else {
                const span = document.createElement('span');
                span.className = 'reveal-word';
                span.textContent = part;
                frag.appendChild(span);
              }
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(el);
    }

    // Groups the now-split words by their rendered line (via viewport
    // top) and gives every word on the same line the same delay, so
    // lines step in one after another instead of word-by-word.
    function groupWordsByLine(el, stepMs) {
      const words = Array.from(el.querySelectorAll('.reveal-word'));
      const lineTops = [];
      words.forEach((word) => {
        const top = Math.round(word.getBoundingClientRect().top);
        let line = lineTops.findIndex((t) => Math.abs(t - top) < 3);
        if (line === -1) {
          lineTops.push(top);
          line = lineTops.length - 1;
        }
        word.style.transitionDelay = `${line * stepMs}ms`;
      });
    }

    lineRevealTargets.forEach((el) => {
      splitIntoWords(el);
      groupWordsByLine(el, 160);
      // Words are now individually pre-hidden via .reveal-word — safe to
      // unmask the container so they're ready for the observer below.
      el.style.opacity = '1';
    });
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-play');
          lineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    lineRevealTargets.forEach((el) => lineObserver.observe(el));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }, (i % 4) * 110);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    blockRevealTargets.forEach((el) => io.observe(el));
  } else {
    // No IntersectionObserver support: skip the animation and just show
    // everything the .js CSS would otherwise be hiding.
    lineRevealTargets.forEach((el) => { el.style.opacity = '1'; });
    blockRevealTargets.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  // FAQ accordion: one open at a time, smooth grid-rows expand (Petaron animation)
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-btn');
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => {
        if (o !== item) {
          o.classList.remove('open');
          o.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });
})();
