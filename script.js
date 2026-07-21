// ---------- Orli marketing site ----------

// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Theme toggle (persisted, respects system default)
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const stored = localStorage.getItem('orli-theme');
if (stored) root.setAttribute('data-theme', stored);

function currentTheme() {
  const attr = root.getAttribute('data-theme');
  if (attr) return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function syncIcon() {
  toggle.textContent = currentTheme() === 'dark' ? '☀️' : '🌙';
}
syncIcon();

toggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('orli-theme', next);
  syncIcon();
});

// Demo request form (front-end only — wires to a real endpoint later)
const form = document.getElementById('demoForm');
const note = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const clinic = form.clinic.value.trim();
  const email = form.email.value.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!clinic || !validEmail) {
    note.style.color = '#e11d48';
    note.textContent = 'Please add your clinic name and a valid work email.';
    return;
  }
  note.style.color = '';
  note.textContent = `Thanks — we'll reach out to ${clinic} at ${email} to set up a walkthrough.`;
  form.reset();
});

// Reveal-on-scroll for cards and sections
const revealables = document.querySelectorAll(
  '.step, .feature, .sec-item, .rung, .stat, .code-card, .widget-card'
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
