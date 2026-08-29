// ---------- Orli marketing site ----------

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

// Reveal-on-scroll: section headlines split into words (blur + rise in,
// staggered per word — see .reveal-word in styles.css), everything else
// (eyebrows, lead paragraphs, list items, cards) fades + rises as a block.
// The hero is excluded — it has its own on-load fade-in (see styles.css)
// since it's visible immediately and scroll can't trigger it.
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
    el.querySelectorAll('.reveal-word').forEach((word, i) => {
      word.style.transitionDelay = `${i * 45}ms`;
    });
  }

  const headings = document.querySelectorAll(':is(.section, .cta-band) .display');
  headings.forEach(splitIntoWords);
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-play');
        headingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  headings.forEach((h) => headingObserver.observe(h));

  const revealables = document.querySelectorAll([
    ':is(.section, .cta-band) .eyebrow',
    '.section-lead', '.cta-lead', '.ladder-note',
    '.check-list li', '.rung', '.code-card',
    '.cmp-table', '.swatches', '.notice-banner', '.section-divider',
  ].join(', '));
  revealables.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, (i % 4) * 70);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12 });
  revealables.forEach((el) => io.observe(el));
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
