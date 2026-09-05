(function () {
  'use strict';

  // Current year in footer. Guarded because this IIFE is shared by all four
  // pages and everything below depends on reaching the end of it — an
  // unguarded throw here would take the FAQ accordion, the reveal animation
  // and the snippet copy button down with it.
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------------------------------------------------
  // The form posts to the site's own Cloudflare Worker (worker.js), which
  // forwards it into Slack's #website-contact. Empty this to switch the form
  // off: it must then not claim anyone was contacted. Nothing is sent, so
  // saying otherwise would be a lie told at the exact moment this page is
  // asking for trust — and this product's positioning is built on saying
  // only what is true. Whatever the visitor typed is preserved either way;
  // it is only cleared after a send actually succeeds.
  // ---------------------------------------------------------------------
  const FORM_ENDPOINT = '/api/demo';

  // ---------------------------------------------------------------------
  // Cal.com: the part of the booking URL after https://cal.com/. Empty it to
  // switch the booking button off (see #calDemo in index.html): a booking
  // button that opens onto nothing would be the same lie as an unconnected
  // form claiming it sent. Namespace and config are what Cal.com's own
  // "element click" embed snippet for this event hands out.
  // ---------------------------------------------------------------------
  const CAL_LINK = 'ron-lev-tabuchov-tgk0nx/orli';
  const CAL_NAMESPACE = 'orli';

  // Cal.com's own embed loader, verbatim from their "popup via element click"
  // snippet, so a booking opens in a modal instead of sending the visitor
  // off-site. Runs on every page: the nav's "book a demo" button is on all
  // five, and each one opens the popup rather than scrolling to the form.
  if (CAL_LINK) {
    (function (C, A, L) {
      const p = (a, ar) => { a.q.push(ar); };
      const d = C.document;
      C.Cal = C.Cal || function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', CAL_NAMESPACE, { origin: 'https://app.cal.com' });
    window.Cal.config = window.Cal.config || {};
    window.Cal.config.forwardQueryParams = true;
    window.Cal.ns[CAL_NAMESPACE]('ui', {
      cssVarsPerTheme: { light: { 'cal-brand': '#0f8a86' }, dark: { 'cal-brand': '#6fd6cf' } },
      // The page is cream; a dark popup over it looked like a different site.
      theme: 'light',
      hideEventTypeDetails: false,
      layout: 'month_view',
    });
    // Cal.com's embed opens the popup for any element carrying these; it
    // listens for clicks on the whole document.
    const openCal = (el) => {
      el.setAttribute('data-cal-link', CAL_LINK);
      el.setAttribute('data-cal-namespace', CAL_NAMESPACE);
      el.setAttribute('data-cal-config', JSON.stringify({ layout: 'month_view', useSlotsViewOnSmallScreen: 'true' }));
    };
    // The band's own "pick a time" button (index.html only).
    const calWrap = document.getElementById('calDemo');
    if (calWrap) {
      openCal(document.getElementById('calDemoBtn'));
      calWrap.hidden = false;
    }
    // Every "book a demo" link on every page. Their href still points at the
    // form section, which is what they do without JavaScript; with it, the
    // popup opens in place and the page stays where the visitor was.
    document.querySelectorAll('[data-demo-cta]').forEach((el) => {
      openCal(el);
      el.addEventListener('click', (e) => e.preventDefault());
    });
  }

  // Demo request form. Only present on index.html — guarded so this file can
  // be shared as-is across the secondary pages (about/integration/privacy),
  // which just need the footer year and the reveal-on-scroll below.
  const form = document.getElementById('demoForm');
  if (form) {
    const note = document.getElementById('formNote');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.textContent : '';
    const inputs = () => form.querySelectorAll('input');

    const clearMarks = () => {
      note.classList.remove('is-error');
      inputs().forEach((i) => {
        i.classList.remove('is-invalid');
        i.setAttribute('aria-invalid', 'false');
      });
    };

    // An error that names neither field leaves the visitor to guess which of
    // the two is wrong. Name it, mark it, and put the cursor in it.
    const fail = (message, field) => {
      clearMarks();
      note.classList.add('is-error');
      note.textContent = message;
      if (field) {
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clinic = form.clinic.value.trim();
      const email = form.email.value.trim();

      if (!clinic) return fail('נא למלא את שם המרפאה.', form.clinic);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail('כתובת האימייל אינה תקינה. בדקו אותה ונסו שוב.', form.email);
      }
      clearMarks();

      if (!FORM_ENDPOINT) {
        // Nothing is sent, so promise nothing — and mark it as the failure it
        // is. Without is-error this painted in the same neutral pill as an
        // ordinary note, so the one message that means "your effort was
        // wasted" looked exactly like the one that means "we got it".
        note.classList.add('is-error');
        note.textContent = 'הטופס עדיין לא מחובר, ולכן הפרטים לא נשלחו. נסו שוב בקרוב.';
        console.warn('[orli] demo form: FORM_ENDPOINT is unset — nothing was sent. See script.js.');
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'שולח…'; }
      note.textContent = '';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        note.textContent = `תודה. ניצור קשר עם ${clinic} בכתובת ${email} כדי לקבוע הדגמה.`;
        form.reset();
      } catch (err) {
        // Never clear the form on failure — retyping it is the fastest way to
        // lose someone who was already willing.
        note.classList.add('is-error');
        note.textContent = 'השליחה נכשלה. הפרטים נשמרו כאן — נסו שוב בעוד רגע.';
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      }
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

  // Mobile navigation. The link row is display:none below 920px; this turns
  // the same <nav> into a disclosure panel rather than duplicating the links,
  // so the desktop row and the mobile menu can never drift apart.
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    const pill = navToggle.closest('.nav-pill');
    const setOpen = (open) => {
      pill.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => {
      setOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    // Following a link closes the menu; on index.html the targets are anchors
    // on the same page, so nothing else would.
    navMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pill.classList.contains('is-open')) {
        setOpen(false);
        navToggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (pill.classList.contains('is-open') && !pill.contains(e.target)) setOpen(false);
    });
  }

  // Embed-snippet copy button (integration.html). navigator.clipboard needs a
  // secure context, which localhost and https give us but file:// does not, so
  // there is a selection-based fallback for anyone opening the page directly.
  document.querySelectorAll('[data-copy-code]').forEach((btn) => {
    const head = btn.closest('.code-head');
    const code = head && head.parentElement && head.parentElement.querySelector('code');
    if (!code) return;
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      // innerText, not textContent: it resolves the highlight spans back into
      // the snippet as rendered, newlines and all.
      const text = code.innerText;
      let ok = true;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        }
      } catch (err) {
        ok = false;
      }
      btn.textContent = ok ? 'הועתק' : 'ההעתקה נכשלה';
      btn.classList.toggle('is-copied', ok);
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove('is-copied');
      }, 2000);
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
})();
