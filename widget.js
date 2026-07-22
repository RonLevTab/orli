/* ============================================================
   Live Orli booking widget — interactive demo.
   A faithful vanilla-JS reproduction of the real Vue widget
   (orli-calendar/web/src/App.vue + step components), driven by
   in-browser mock data so visitors can play the whole flow:
     catalog → date → time → patient → confirm (OTP) → success
   No backend needed. OTP accepts any 6 digits.
   ============================================================ */
(function () {
  'use strict';

  // ---- bilingual strings (from web/src/i18n.ts) ----
  var S = {
    bookTitle: ['לקביעת פגישה', 'Book an appointment'],
    treatment: ['טיפול', 'Treatment'],
    practitioner: ['מטפל/ת', 'Practitioner'],
    when: ['תאריך ושעה', 'Date and time'],
    chooseDate: ['בחרו תאריך', 'Choose a date'],
    chooseTime: ['בחרו שעה', 'Choose a time'],
    yourDetails: ['הפרטים שלכם', 'Your details'],
    confirmTitle: ['אישור התור', 'Confirm your appointment'],
    bookedTitle: ['התור נקבע!', 'Appointment booked!'],
    firstName: ['שם פרטי', 'First name'],
    lastName: ['שם משפחה', 'Last name'],
    phone: ['מספר טלפון', 'Phone number'],
    email: ['אימייל', 'Email'],
    marketingConsent: [
      'אני מסכים/ה לקבל תזכורות לפגישות, עדכונים, הצעות ואפשרויות לשינוי מועד',
      'I agree to receive appointment reminders, updates, offers, rescheduling options, etc.',
    ],
    back: ['חזרה', 'Back'],
    continue: ['המשך', 'Continue'],
    confirm: ['אישור הזמנה', 'Confirm booking'],
    booking: ['קובע תור…', 'Booking…'],
    nextMonth: ['חודש הבא', 'Next month'],
    prevMonth: ['חודש קודם', 'Previous month'],
    noSlots: ['אין זמנים פנויים החודש. נסו את החודש הבא.', 'No available times this month. Try the next month.'],
    otpSentTo: ['שלחנו קוד אימות לאימייל {email}', 'We sent a verification code to {email}'],
    otpCode: ['קוד אימות', 'Verification code'],
    resendCode: ['שליחת קוד חדש', 'Send a new code'],
    wrongOtpError: ['הקוד שגוי. נסו שוב.', 'The code is incorrect. Please try again.'],
    bookedDetails: ['התור שלכם בתאריך {date} בשעה {time}.', 'Your appointment is on {date} at {time}.'],
    writtenToOptima: ['נכתב ל‑Optima ✓', 'written to Optima ✓'],
    bookAnother: ['לקביעת פגישה נוספת', 'Book another appointment'],
    otpDemoHint: ['לצורך ההדגמה: כל 6 ספרות יתקבלו', 'Demo: any 6-digit code works'],
  };

  var MAX_MONTH_OFFSET = 2;

  // ---- mock catalog (practitioner cards, each with treatments) ----
  var CARDS = [
    {
      practitioner: { id: 'p1', he: 'ד״ר רון', en: 'Dr. Ron' },
      treatments: [
        { id: 't1', he: 'בדיקה תקופתית', en: 'Check-up' },
        { id: 't2', he: 'ניקוי אבנית', en: 'Cleaning' },
      ],
    },
    {
      practitioner: { id: 'p2', he: 'ד״ר דניאל', en: 'Dr. Daniel' },
      treatments: [
        { id: 't3', he: 'ייעוץ', en: 'Consultation' },
        { id: 't4', he: 'טיפול שורש', en: 'Root canal' },
      ],
    },
  ];

  var SLOT_TIMES = ['09:00', '09:45', '10:30', '11:15', '12:00', '14:00', '14:45', '15:30', '16:15', '17:00'];

  // Deterministic-ish availability: a few weekdays per month with a subset of slots.
  function availabilityFor(monthOffset, seedKey) {
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    var year = base.getFullYear();
    var month = base.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startDay = monthOffset === 0 ? now.getDate() + 1 : 1;
    var seed = 0;
    for (var i = 0; i < seedKey.length; i++) seed += seedKey.charCodeAt(i);
    var out = [];
    for (var d = startDay; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var dow = date.getDay(); // 0 Sun .. 6 Sat
      if (dow === 5 || dow === 6) continue; // clinic closed Fri/Sat
      // ~ every 3rd eligible day is open
      if ((d + seed) % 3 !== 0) continue;
      var slots = [];
      for (var s = 0; s < SLOT_TIMES.length; s++) {
        if ((d + s + seed) % 2 === 0) slots.push({ start: SLOT_TIMES[s] });
      }
      if (!slots.length) continue;
      out.push({ date: iso(date), slots: slots });
      if (out.length >= 8) break;
    }
    return out;
  }

  function iso(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + m + '-' + d;
  }

  var DATE_FMT = { weekday: 'long', day: 'numeric', month: 'long' };
  function formatDate(dateStr) {
    var parsed = new Date(dateStr + 'T00:00:00');
    return [parsed.toLocaleDateString('he', DATE_FMT), parsed.toLocaleDateString('en', DATE_FMT)];
  }

  // ---- tiny DOM helpers ----
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // The widget follows the SITE language (the <html lang> the nav toggle sets).
  // he → rtl, en → ltr. One value, the whole layout follows.
  function siteLang() { return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'he'; }
  var LANG = siteLang();
  function dir() { return LANG === 'he' ? 'rtl' : 'ltr'; }

  function bi(pair) {
    var he = pair[0] || pair[1];
    var en = pair[1] || pair[0];
    var primary = LANG === 'he' ? he : en;
    var secondary = LANG === 'he' ? en : he;
    var showSec = he && en && he !== en;
    // The secondary line runs opposite to the primary, so mark its own dir.
    var secDir = LANG === 'he' ? 'ltr' : 'rtl';
    return '<span class="obw-bi"><span>' + esc(primary) + '</span>' +
      (showSec ? '<span class="obw-en" dir="' + secDir + '">' + esc(secondary) + '</span>' : '') +
      '</span>';
  }

  // <bdi>: isolates a Latin/number run embedded in Hebrew (or vice-versa) so
  // the bidi algorithm never reorders its punctuation. Best practice for
  // user-generated or opposite-direction inline values.
  function bdi(text) { return '<bdi>' + esc(text) + '</bdi>'; }
  function fill(pair, vars) {
    return [pair[0].replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; }),
            pair[1].replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; })];
  }

  // ---- widget instance ----
  function mount(root) {
    var st = null;
    function reset() {
      LANG = siteLang();
      st = {
        step: 'catalog', card: null, treatment: null, practitioner: null,
        monthOffset: 0, day: null, time: '',
        // Pre-filled with a placeholder identity so the demo needs zero typing —
        // it's the Israeli "John Doe". Editable, but ready to click straight through.
        firstName: LANG === 'he' ? 'ישראל' : 'Demo',
        lastName: LANG === 'he' ? 'ישראלי' : 'Patient',
        phone: '050-123-4567',
        email: 'demo@orli.health',
        consent: false,
        otp: '', otpError: false, resendWait: 0, submitting: false, bookingId: null,
      };
    }
    reset();

    var timer = null;
    function startResend() {
      st.resendWait = 90;
      clearInterval(timer);
      timer = setInterval(function () {
        st.resendWait -= 1;
        if (st.resendWait <= 0) clearInterval(timer);
        var el = root.querySelector('[data-resend-wait]');
        if (el) el.textContent = st.resendWait > 0 ? ' (' + st.resendWait + ')' : '';
        var btn = root.querySelector('[data-resend]');
        if (btn) btn.disabled = st.resendWait > 0;
      }, 1000);
    }

    var STEP_ORDER = ['catalog', 'date', 'time', 'patient', 'confirm'];

    function render() {
      var showProgress = st.step !== 'success';
      var idx = STEP_ORDER.indexOf(st.step);
      var progress = '';
      if (showProgress) {
        var segs = '';
        for (var n = 0; n < 5; n++) segs += '<span class="obw-progress-seg' + (n <= idx ? ' is-on' : '') + '"></span>';
        progress = '<div class="obw-progress" aria-hidden="true">' + segs + '</div>';
      }
      // Follow the site language, and mirror direction to match (rtl for
      // Hebrew) so the widget reads naturally too.
      LANG = siteLang();
      root.setAttribute('dir', dir());
      root.innerHTML =
        '<div class="obw-widget">' +
          '<header class="obw-header"><span class="obw-brand">Orli</span></header>' +
          progress +
          '<main class="obw-step">' + stepHtml() + '</main>' +
        '</div>';
      wire();
    }

    function stepHtml() {
      switch (st.step) {
        case 'catalog': return catalogHtml();
        case 'date': return dateHtml();
        case 'time': return timeHtml();
        case 'patient': return patientHtml();
        case 'confirm': return confirmHtml();
        case 'success': return successHtml();
      }
      return '';
    }

    function backBtn() {
      // "Back" points toward the start edge, which mirrors with direction.
      var chev = LANG === 'he' ? '›' : '‹';
      return '<button class="obw-back-btn" data-back>' + chev + ' ' + bi(S.back) + '</button>';
    }

    function catalogHtml() {
      var html = '<h1 class="obw-title">' + bi(S.bookTitle) + '</h1><div class="obw-list">';
      CARDS.forEach(function (card, ci) {
        html += '<section class="obw-card"><h2 class="obw-card-title">' +
          bi([card.practitioner.he, card.practitioner.en]) + '</h2><div class="obw-list">';
        card.treatments.forEach(function (tr, ti) {
          html += '<button class="obw-option" data-offering="' + ci + ':' + ti + '">' +
            bi([tr.he, tr.en]) + '</button>';
        });
        html += '</div></section>';
      });
      return html + '</div>';
    }

    function dateHtml() {
      var days = availabilityFor(st.monthOffset, st.treatment.id + st.practitioner.id);
      var list;
      if (!days.length) {
        list = '<p class="obw-muted">' + bi(S.noSlots) + '</p>';
      } else {
        list = '<div class="obw-list">' + days.map(function (day, i) {
          return '<button class="obw-option" data-day="' + i + '">' + bi(formatDate(day.date)) + '</button>';
        }).join('') + '</div>';
      }
      st._days = days;
      // Arrows point "back / forward in time" — they mirror with direction.
      var prevArrow = LANG === 'he' ? '→' : '←';
      var nextArrow = LANG === 'he' ? '←' : '→';
      return backBtn() + '<h1 class="obw-title">' + bi(S.chooseDate) + '</h1>' +
        '<div class="obw-month-nav">' +
          '<button class="obw-nav-btn" data-month="-1"' + (st.monthOffset === 0 ? ' disabled' : '') + '>' +
            '<span class="obw-nav-arrow">' + prevArrow + '</span>' + bi(S.prevMonth) + '</button>' +
          '<button class="obw-nav-btn" data-month="1"' + (st.monthOffset >= MAX_MONTH_OFFSET ? ' disabled' : '') + '>' +
            bi(S.nextMonth) + '<span class="obw-nav-arrow">' + nextArrow + '</span></button>' +
        '</div><div class="obw-date-results">' + list + '</div>';
    }

    function timeHtml() {
      var slots = st.day.slots.map(function (slot) {
        return '<button class="obw-slot" data-time="' + slot.start + '">' + slot.start + '</button>';
      }).join('');
      return backBtn() + '<h1 class="obw-title">' + bi(S.chooseTime) + '</h1>' +
        '<p class="obw-muted">' + bi(formatDate(st.day.date)) + '</p>' +
        '<div class="obw-slots">' + slots + '</div>';
    }

    function field(key, name, value, type) {
      return '<label class="obw-field">' + bi(S[key]) +
        '<input data-field="' + name + '" type="' + (type || 'text') + '" value="' + esc(value) + '" /></label>';
    }

    function patientHtml() {
      return backBtn() + '<h1 class="obw-title">' + bi(S.yourDetails) + '</h1><form data-patient>' +
        field('firstName', 'firstName', st.firstName) +
        field('lastName', 'lastName', st.lastName) +
        field('phone', 'phone', st.phone, 'tel') +
        field('email', 'email', st.email, 'email') +
        '<label class="obw-consent"><input type="checkbox" data-field="consent"' + (st.consent ? ' checked' : '') + ' />' +
          bi(S.marketingConsent) + '</label>' +
        '<button type="submit" class="obw-primary-btn" data-continue>' + bi(S.continue) + '</button></form>';
    }

    function confirmHtml() {
      var dateLabel = formatDate(st.day.date)[LANG === 'he' ? 0 : 1];
      return backBtn() + '<h1 class="obw-title">' + bi(S.confirmTitle) + '</h1>' +
        '<dl class="obw-summary">' +
          '<div><dt>' + bi(S.treatment) + '</dt><dd>' + bi([st.treatment.he, st.treatment.en]) + '</dd></div>' +
          '<div><dt>' + bi(S.practitioner) + '</dt><dd>' + bi([st.practitioner.he, st.practitioner.en]) + '</dd></div>' +
          '<div><dt>' + bi(S.when) + '</dt><dd>' + bdi(dateLabel + ' · ' + st.time) + '</dd></div>' +
          '<div><dt>' + bi(S.yourDetails) + '</dt><dd>' +
            bdi(st.firstName + ' ' + st.lastName + ' · ' + st.phone + ' · ' + st.email) + '</dd></div>' +
        '</dl>' +
        '<div class="obw-otp">' +
          '<p class="obw-otp-hint">' + bi(fill(S.otpSentTo, { email: st.email })) + '</p>' +
          '<p class="obw-otp-hint" style="color:var(--obw-primary)">' + bi(S.otpDemoHint) + '</p>' +
          '<label class="obw-field">' + bi(S.otpCode) +
            '<input data-otp inputmode="numeric" maxlength="6" value="' + esc(st.otp) + '" /></label>' +
          '<button type="button" class="obw-resend-btn" data-resend' + (st.resendWait > 0 ? ' disabled' : '') + '>' +
            bi(S.resendCode) + '<span data-resend-wait>' + (st.resendWait > 0 ? ' (' + st.resendWait + ')' : '') + '</span></button>' +
        '</div>' +
        (st.otpError ? '<p class="obw-error">' + bi(S.wrongOtpError) + '</p>' : '') +
        '<button class="obw-primary-btn" data-confirm' + (st.submitting || !/^\d{6}$/.test(st.otp.trim()) ? ' disabled' : '') + '>' +
          bi(st.submitting ? S.booking : S.confirm) + '</button>';
    }

    function successHtml() {
      var dateLabel = formatDate(st.day.date)[LANG === 'he' ? 0 : 1];
      return '<div style="text-align:center"><div class="obw-success-badge" style="margin-inline:auto">✓</div>' +
        '<h1 class="obw-title" style="text-align:center">' + bi(S.bookedTitle) + '</h1>' +
        '<p>' + bi(fill(S.bookedDetails, { date: dateLabel, time: st.time })) + '</p>' +
        '<p class="obw-muted" style="font-size:.82rem">' +
          bdi('Booking ' + st.bookingId) + ' · ' + bi(S.writtenToOptima) + '</p>' +
        '<button class="obw-nav-btn" data-restart style="margin-top:8px">' + bi(S.bookAnother) + '</button></div>';
    }

    // ---- event wiring ----
    function wire() {
      root.querySelectorAll('[data-offering]').forEach(function (b) {
        b.addEventListener('click', function () {
          var p = b.getAttribute('data-offering').split(':');
          var card = CARDS[+p[0]];
          st.card = card;
          st.practitioner = card.practitioner;
          st.treatment = card.treatments[+p[1]];
          st.monthOffset = 0;
          st.step = 'date';
          render();
        });
      });
      var backEl = root.querySelector('[data-back]');
      if (backEl) backEl.addEventListener('click', function () {
        var prev = { date: 'catalog', time: 'date', patient: 'time', confirm: 'patient' }[st.step];
        st.step = prev; render();
      });
      root.querySelectorAll('[data-month]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.monthOffset = Math.min(MAX_MONTH_OFFSET, Math.max(0, st.monthOffset + Number(b.getAttribute('data-month'))));
          render();
        });
      });
      root.querySelectorAll('[data-day]').forEach(function (b) {
        b.addEventListener('click', function () { st.day = st._days[+b.getAttribute('data-day')]; st.step = 'time'; render(); });
      });
      root.querySelectorAll('[data-time]').forEach(function (b) {
        b.addEventListener('click', function () { st.time = b.getAttribute('data-time'); st.step = 'patient'; render(); });
      });
      var pform = root.querySelector('[data-patient]');
      if (pform) {
        pform.querySelectorAll('[data-field]').forEach(function (inp) {
          inp.addEventListener('input', function () {
            var k = inp.getAttribute('data-field');
            st[k] = inp.type === 'checkbox' ? inp.checked : inp.value;
          });
        });
        pform.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!validPatient()) { flashInvalid(pform); return; }
          st.otp = ''; st.otpError = false; st.step = 'confirm'; render(); startResend();
        });
      }
      var otp = root.querySelector('[data-otp]');
      if (otp) otp.addEventListener('input', function () {
        st.otp = otp.value.replace(/\D/g, '').slice(0, 6);
        otp.value = st.otp;
        var cb = root.querySelector('[data-confirm]');
        if (cb) cb.disabled = st.submitting || !/^\d{6}$/.test(st.otp);
      });
      var resend = root.querySelector('[data-resend]');
      if (resend) resend.addEventListener('click', function () { st.otp = ''; render(); startResend(); });
      var confirm = root.querySelector('[data-confirm]');
      if (confirm) confirm.addEventListener('click', function () {
        if (!/^\d{6}$/.test(st.otp.trim())) return;
        st.submitting = true; render();
        setTimeout(function () {
          st.submitting = false;
          st.bookingId = 'OB-' + Math.floor(100000 + Math.random() * 899999);
          clearInterval(timer);
          st.step = 'success'; render();
        }, 900);
      });
      var restart = root.querySelector('[data-restart]');
      if (restart) restart.addEventListener('click', function () { reset(); render(); });
    }

    function validPatient() {
      return st.firstName.trim() && st.lastName.trim() && st.phone.trim().length >= 7 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim());
    }
    function flashInvalid(form) {
      form.querySelectorAll('[data-field]').forEach(function (inp) {
        var bad = (inp.type !== 'checkbox') && !String(inp.value).trim();
        inp.style.borderColor = bad ? '#d70015' : '';
      });
    }

    // Scroll-driven "scenes": jump the widget to a given step with all the
    // prior selections pre-made, so a scrollytelling section can walk it
    // through the whole booking flow without any clicks.
    function setScene(i) {
      reset();
      var card = CARDS[0];
      var days = availabilityFor(0, card.treatments[0].id + card.practitioner.id);
      var day = days[0] || null;
      var timeStr = (day && day.slots.length) ? day.slots[Math.min(1, day.slots.length - 1)].start : '10:30';
      var order = ['catalog', 'date', 'time', 'patient', 'confirm', 'success'];
      st.step = order[Math.max(0, Math.min(order.length - 1, i))];
      if (st.step !== 'catalog') {
        st.card = card; st.practitioner = card.practitioner; st.treatment = card.treatments[0];
      }
      if (['time', 'patient', 'confirm', 'success'].indexOf(st.step) >= 0) {
        st.day = day; st.time = timeStr;
      }
      if (['confirm', 'success'].indexOf(st.step) >= 0) st.otp = '123456';
      if (st.step === 'success') st.bookingId = 'OB-' + Math.floor(100000 + Math.random() * 899999);
      render();
    }

    render();
    return { setScene: setScene, render: render };
  }

  function init() {
    var widgets = [].slice.call(document.querySelectorAll('[data-orli-widget]'));
    widgets.forEach(function (el) {
      el.classList.add('orli-live');
      el.__orli = mount(el);
    });
    // Re-render whenever the site language changes (<html lang> flips).
    var mo = new MutationObserver(function () {
      widgets.forEach(function (el) { if (el.__orli) el.__orli.render(); });
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
