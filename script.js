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

    // Everything below depends on a script from app.cal.com actually arriving.
    // An ad-blocker, a corporate proxy or a Cal outage is enough to stop it,
    // and this is the one button the whole site exists to get clicked — so
    // nothing commits to Cal until that script has loaded:
    //
    //   - the CTAs keep their own href (the demo form) and only stop
    //     navigating once the popup can really open. Swallowing the click
    //     unconditionally, as this used to, turned every "book a demo" on all
    //     five pages into a dead control the moment Cal was unreachable.
    //   - #calDemoBtn, "pick a time", is a <button> with nothing to fall back
    //     to, so it stays hidden until there is something behind it.
    const calCtas = document.querySelectorAll('[data-demo-cta]');
    const calWrap = document.getElementById('calDemoBtn');
    let calReady = false;
    let calSettled = false;

    const calLoaded = () => {
      if (calSettled) return;
      calSettled = true;
      calReady = true;
      if (calWrap) calWrap.hidden = false;
    };
    const calFailed = () => {
      if (calSettled) return;
      calSettled = true;
      // Drop the embed hooks too: a script that turns up late must not find
      // half-wired buttons and start intercepting clicks the page has already
      // handed back to the form.
      calCtas.forEach((el) => {
        el.removeAttribute('data-cal-link');
        el.removeAttribute('data-cal-namespace');
        el.removeAttribute('data-cal-config');
      });
      if (calWrap) calWrap.hidden = true;
      // The band's lead promised a slot picker; without Cal there is none.
      const lead = document.querySelector('.cta-lead');
      if (lead) lead.textContent = 'ראו את אורלי קובעת פגישה אמיתית ליומן פעיל בפחות מדקה. השאירו פרטים ונחזור אליכם עם שעה להדגמה.';
      console.warn('[orli] Cal.com embed unavailable — demo CTAs fall back to the form at #contact.');
    };

    calCtas.forEach((el) => {
      openCal(el);
      el.addEventListener('click', (e) => { if (calReady) e.preventDefault(); });
    });
    const calBtn = document.getElementById('calDemoBtn');
    if (calBtn) openCal(calBtn);

    // The loader above appends the tag synchronously, so it is already here.
    const calScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]');
    if (calScript) {
      calScript.addEventListener('load', calLoaded);
      calScript.addEventListener('error', calFailed);
      // A request that is black-holed rather than refused fires neither event,
      // which would leave the CTA waiting forever. Past this, treat it as gone.
      setTimeout(calFailed, 6000);
    } else {
      calFailed();
    }
  }

  // Contact form. Lives in a <dialog> on index.html (#contactDialog), opened
  // from the CTA band's "צרו קשר" and from the footer link on that page. On
  // the other pages the same footer link carries no dialog to open, so it is
  // left alone and simply goes to /#contact. Guarded so this file can be
  // shared as-is across every page.
  const dialog = document.getElementById('contactDialog');
  const form = document.getElementById('demoForm');
  if (dialog && form) {
    const note = document.getElementById('formNote');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.textContent : '';
    // form.elements, not form.name: a form's own `name` property shadows a
    // field called name.
    const f = form.elements;
    const fields = () => form.querySelectorAll('.field :is(input, textarea)');
    let opener = null;

    const clearMarks = () => {
      note.classList.remove('is-error');
      fields().forEach((i) => {
        i.classList.remove('is-invalid');
        i.setAttribute('aria-invalid', 'false');
      });
    };

    const openContact = (from) => {
      opener = from || document.activeElement;
      clearMarks();
      note.textContent = '';
      form.classList.remove('is-sent');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      // showModal() honours the name field's autofocus; the fallback needs a hand.
      if (document.activeElement !== f.name) f.name.focus();
    };
    const closeContact = () => { if (dialog.open) dialog.close(); else dialog.removeAttribute('open'); };
    // Native dialogs usually hand focus back on close; make it certain.
    dialog.addEventListener('close', () => { if (opener && opener.focus) opener.focus(); });
    document.querySelectorAll('[data-contact-open]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); openContact(el); });
    });
    dialog.querySelectorAll('[data-contact-close]').forEach((el) => el.addEventListener('click', closeContact));
    // A click on the backdrop lands on the <dialog> element itself, never on
    // its content, so this is exactly "clicked outside the card".
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeContact(); });

    // An error that names neither field leaves the visitor to guess which
    // one is wrong. Name it, mark it, and put the cursor in it.
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
      const name = f.name.value.trim();
      const email = f.email.value.trim();
      const message = f.message.value.trim();

      if (!name) return fail('נא למלא את השם.', f.name);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail('כתובת האימייל אינה תקינה. בדקו אותה ונסו שוב.', f.email);
      }
      if (!message) return fail('כתבו לנו כמה מילים, כדי שנדע במה לעזור.', f.message);
      clearMarks();

      if (!FORM_ENDPOINT) {
        // Nothing is sent, so promise nothing — and mark it as the failure it
        // is, not as a neutral note.
        note.classList.add('is-error');
        note.textContent = 'הטופס עדיין לא מחובר, ולכן ההודעה לא נשלחה. נסו שוב בקרוב.';
        console.warn('[orli] contact form: FORM_ENDPOINT is unset — nothing was sent. See script.js.');
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'שולח…'; }
      note.textContent = '';
      // A request that never resolves would leave the button disabled and the
      // visitor staring at "שולח…" for good. Give up after 15s and say so.
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timeout = ctl ? setTimeout(() => ctl.abort(), 15000) : null;
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
          signal: ctl ? ctl.signal : undefined,
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        note.textContent = `תודה, ${name}. נחזור אליכם בכתובת ${email}.`;
        form.reset();
        form.classList.add('is-sent');
        note.focus();
      } catch (err) {
        // Never clear the form on failure — retyping it is the fastest way to
        // lose someone who was already willing. The other way in is Cal's
        // "pick a time" on the band behind this dialog, and only while Cal
        // actually loaded; offer it when it is there, promise nothing when not.
        const calBtn = document.getElementById('calDemoBtn');
        const calUp = !!calBtn && !calBtn.hidden;
        const timedOut = err && err.name === 'AbortError';
        note.classList.add('is-error');
        note.textContent = (timedOut ? 'השליחה נתקעה. ' : 'השליחה נכשלה. ') + 'ההודעה נשמרה כאן. נסו שוב בעוד רגע'
          + (calUp ? ', או סגרו את החלון ובחרו שעה להדגמה.' : '.');
        // Nothing else moves focus on this path, so a polite status region
        // could go unread. Land on the message; the retry sits right above it.
        note.focus();
      } finally {
        if (timeout) clearTimeout(timeout);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      }
    });
  }

  // "From the clinic's site straight into the calendar" (index.html .bridge):
  // while the block is on screen, the patient's journey plays as a short
  // film in one frame — the launcher on the clinic's site is tapped, the
  // panel opens, a slot is chosen, the widget shows its confirmation, the
  // Optima day view rises over the page and the booking settles into its
  // row — held for three seconds, then it plays again. The film starts
  // only once the block is mostly on screen, so the viewer sees the site
  // at rest before the first tap; scrolling away stops it and clears the
  // frame, so coming back always starts from the beginning, never
  // mid-scene.
  const bridge = document.querySelector('[data-bridge]');
  if (bridge) {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movie = bridge.querySelector('.bridge-movie');
    const site = movie.querySelector('.bm-site');
    const slot = movie.querySelector('[data-bridge-from="movie"]');
    const row = movie.querySelector('[data-bridge-to="movie"]');
    let visible = false;
    let playing = false;
    let timers = [];

    const after = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
    const reset = () => {
      movie.classList.remove('is-cal');
      site.classList.remove('is-tapping', 'is-open', 'is-picked', 'is-confirmed');
      slot.classList.remove('is-picking');
      row.classList.remove('is-landed');
    };
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      playing = false;
      reset();
    };
    const scheduleReplay = () => {
      after(3000, () => {
        reset();
        // Let the popup and panel clear before the film lights up again.
        after(700, play);
      });
    };
    const land = () => {
      row.classList.add('is-landed');
      playing = false;
      if (visible) scheduleReplay();
    };
    function play() {
      if (playing) return;
      playing = true;
      // A beat on each screen the viewer reads (the site, the open panel,
      // the confirmation) — but the widget itself answers a tap at once:
      // a slow open here would read as a slow product.
      after(1500, () => site.classList.add('is-tapping'));
      after(2000, () => site.classList.add('is-open'));
      after(4400, () => { slot.classList.add('is-picking'); site.classList.add('is-picked'); });
      after(5600, () => site.classList.add('is-confirmed'));
      after(8200, () => movie.classList.add('is-cal'));
      after(9000, land);
    }

    if (still) {
      // No motion, no loop: the finished picture, once.
      site.classList.add('is-open', 'is-picked', 'is-confirmed');
      movie.classList.add('is-cal');
      row.classList.add('is-landed');
    } else if ('IntersectionObserver' in window) {
      // Most of the block has to be on screen before the first tap, so the
      // film is never already running when the section lands. Capped by the
      // viewport: on a short screen the block may be taller than 60% of it
      // and a fixed ratio would never be reached there.
      const need = Math.min(0.6, Math.max(0.2, (window.innerHeight * 0.7) / Math.max(1, bridge.offsetHeight)));
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (!visible) { stop(); return; }
        if (!playing) play();
      }, { threshold: need });
      io.observe(bridge);
    } else {
      play();
    }
  }

  // One demo date on every mock: the hero card, the bridge film, the admin
  // page's email. widget.js books its walked-through appointment on the
  // first clinic day after today (Sunday to Thursday), so these say the
  // same day, in the same words the widget uses, instead of a date typed
  // into the markup months ago. [data-mock-date]: weekday, day and month;
  // [data-mock-day]: the weekday alone.
  (function () {
    const dated = document.querySelectorAll('[data-mock-date], [data-mock-day]');
    if (!dated.length) return;
    const d = new Date();
    do { d.setDate(d.getDate() + 1); } while (d.getDay() > 4);
    const full = d.toLocaleDateString('he', { weekday: 'long', day: 'numeric', month: 'long' });
    const day = d.toLocaleDateString('he', { weekday: 'long' });
    dated.forEach((el) => { el.textContent = el.hasAttribute('data-mock-day') ? day : full; });
  })();

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

  // Tells the watchdog in each page's <head> that this file arrived and the
  // reveal is being handled. Without it, a script.js that 404s or is dropped
  // by a flaky connection would leave every headline, lead and check-list on
  // the site at opacity 0 — the `.js` class hiding them is set inline, before
  // this file is even requested. The watchdog drops that class if this
  // attribute never appears, so the page degrades to plain visible text.
  document.documentElement.setAttribute('data-reveal-ready', '');

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
    //
    // Every read is taken before any write. Interleaving them, as this used
    // to, makes each getBoundingClientRect() flush the style change written
    // for the previous word: 106 words across this page measured 17.8ms of
    // forced reflow on the load path, against 0.6ms batched.
    // Measures only, and hands back the writes to run later — so the caller
    // can finish reading every element before the first style is set.
    function groupWordsByLine(el, stepMs) {
      const words = Array.from(el.querySelectorAll('.reveal-word'));
      const tops = words.map((word) => Math.round(word.getBoundingClientRect().top));
      const lineTops = [];
      const delays = tops.map((top) => {
        let line = lineTops.findIndex((t) => Math.abs(t - top) < 3);
        if (line === -1) {
          lineTops.push(top);
          line = lineTops.length - 1;
        }
        return line * stepMs;
      });
      return () => words.forEach((word, i) => { word.style.transitionDelay = `${delays[i]}ms`; });
    }

    // Three passes, not one loop of three steps: splitting is a DOM write and
    // measuring is a read, so doing them per element made every element's
    // first measurement flush the previous element's rewritten text. Split
    // everything, measure everything, then write everything.
    lineRevealTargets.forEach((el) => splitIntoWords(el));
    const grouped = Array.from(lineRevealTargets).map((el) => groupWordsByLine(el, 160));
    grouped.forEach((apply) => apply());
    // Words are now individually pre-hidden via .reveal-word — safe to
    // unmask the containers so they're ready for the observer below.
    lineRevealTargets.forEach((el) => { el.style.opacity = '1'; });
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
      btn.textContent = ok ? 'הועתק' : 'לא הועתק. סמנו והעתיקו ידנית';
      btn.classList.toggle('is-copied', ok);
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove('is-copied');
      }, 2000);
    });
  });

  // FAQ accordion: one open at a time, smooth grid-rows expand (Petaron
  // animation). A collapsed panel is 0fr tall but still laid out, so its
  // contents stay reachable unless they are explicitly taken out — the third
  // answer links to panel.html, and that link was tabbable while invisible.
  // `inert` removes it from both the tab order and the accessibility tree;
  // styles.css carries the visibility half for browsers without it.
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-btn');
    const panel = item.querySelector('.faq-panel');
    const setOpen = (open) => {
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (panel) panel.inert = !open;
    };
    setOpen(item.classList.contains('open'));
    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((o) => {
        if (o !== item) {
          o.classList.remove('open');
          o.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
          const p = o.querySelector('.faq-panel');
          if (p) p.inert = true;
        }
      });
      setOpen(willOpen);
    });
  });
})();
