// ---------- Orli marketing site ----------

// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Demo request form (front-end only; wires to a real endpoint later)
const form = document.getElementById('demoForm');
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

// Reveal-on-scroll for cards and sections
const revealables = document.querySelectorAll(
  '.hiw-card, .feature, .sec-item, .rung, .stat, .code-card'
);
if ('IntersectionObserver' in window) {
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

// Cursor-following glow border on the how-it-works cards (Petaron GlowingEffect)
document.querySelectorAll('[data-glow]').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

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
