/* ============================================================
   Live Orli booking widget — interactive demo.

   A static, dependency-free reproduction of the real Vue widget, so
   this page never depends on the booking service being reachable.
   Flow: catalog → date → time → patient → confirm (OTP) → success.
   No backend. OTP accepts any 6 digits.

   ------------------------------------------------------------
   HOW TO REFRESH THIS AGAINST THE REAL WIDGET
   ------------------------------------------------------------
   Every block below is marked with a SOURCE: comment naming the
   file it mirrors. All paths are relative to the sibling repo:

       ../orli-calendar/widget/src/

   Read the named file, diff it against the block underneath the
   comment, and port the differences. The map:

     App.vue                  — step order, progress bar, flow
     i18n.ts                  — the S string table, formatDate,
                                formatPrice
     demo.ts                  — CARDS, availability, DEMO_PREFILL
     style.css                — mirrored in this repo's widget.css
     components/CatalogStep.vue — catalogHtml()
     components/DateStep.vue    — dateHtml()
     components/TimeStep.vue    — timeHtml()
     components/PatientStep.vue — patientHtml()
     components/ConfirmStep.vue — confirmHtml()
     components/SuccessStep.vue — successHtml()

   ManageStep.vue (reschedule/cancel) is deliberately NOT mirrored:
   it is reached from an emailed link, never from the booking flow
   this demo walks.
   ============================================================ */
(function () {
  'use strict';

  // SOURCE: i18n.ts — `strings`. Only the keys this demo can actually
  // reach are mirrored; error/loading/manage keys are omitted because the
  // static demo never enters those states. Keys marked DEMO-ONLY have no
  // counterpart in i18n.ts and exist for this page.
  // ---- bilingual strings ----
  var S = {
    bookTitle: ['לקביעת פגישה', 'Book an appointment'],
    treatment: ['טיפול', 'Treatment'],
    practitioner: ['מטפל/ת', 'Practitioner'],
    price: ['מחיר', 'Price'],
    freePrice: ['חינם', 'Free'],
    when: ['תאריך ושעה', 'Date and time'],
    chooseDate: ['בחרו תאריך', 'Choose a date'],
    chooseTime: ['בחרו שעה', 'Choose a time'],
    yourDetails: ['הפרטים שלכם', 'Your details'],
    confirmTitle: ['אישור התור', 'Confirm appointment'],
    bookedTitle: ['התור נקבע!', 'Appointment booked!'],
    firstName: ['שם פרטי', 'First name'],
    lastName: ['שם משפחה', 'Last name'],
    phone: ['מספר טלפון', 'Phone number'],
    email: ['אימייל', 'Email'],
    marketingConsent: [
      'אני מעוניין/ת לקבל עדכונים והצעות מהמרפאה',
      'I would like to receive updates and offers from the clinic',
    ],
    back: ['חזרה', 'Back'],
    continue: ['המשך', 'Continue'],
    confirm: ['אישור הזמנה', 'Confirm booking'],
    booking: ['קובע תור…', 'Booking…'],
    nextMonth: ['חודש הבא', 'Next month'],
    prevMonth: ['חודש קודם', 'Previous month'],
    noSlots: [
      'אין זמנים פנויים בטווח התאריכים הזמין לקביעה.',
      'No available times in the bookable date range.',
    ],
    otpSentTo: ['שלחנו קוד אימות לאימייל {email}', 'We sent a verification code to {email}'],
    otpCode: ['קוד אימות', 'Verification code'],
    resendCode: ['שליחת קוד חדש', 'Send a new code'],
    wrongOtpError: ['הקוד שגוי. נסו שוב.', 'The code is incorrect. Please try again.'],
    sendOtp: ['שלח קוד לאימות', 'Send code to my email'],
    // DEMO-ONLY: the real widget checks the code against the server; here any
    // 6 digits pass, so the visitor has to be told that.
    otpDemoHint: ['לצורך ההדגמה: כל 6 ספרות יתקבלו', 'Demo: any 6-digit code works'],
    // DEMO-ONLY: the real SuccessStep.vue ends the flow with no controls,
    // because there the patient is finished and closes the widget. On a
    // marketing page the success scene is a dead end instead, so the demo
    // gets a way back to the start. Do not port this upstream.
    restartDemo: ['להתחיל את ההדגמה מחדש', 'Restart the demo'],
    // No i18n.ts counterpart: the real PatientStep.vue leans on native form
    // validation, which this hand-rolled form does not have.
    fixFields: ['יש להשלים: {fields}', 'Please complete: {fields}'],
  };

  // SOURCE: demo.ts — getBookingSettings() returns booking_months_ahead: 2,
  // i.e. this month plus the next, so the highest reachable offset is 1.
  // demoAvailability() agrees: it returns [] for any monthOffset > 1.
  var MAX_MONTH_OFFSET = 1;

  // SOURCE: demo.ts — CATALOG / APPOINTMENT_TYPES / PRACTITIONERS.
  // One card per practitioner, each with their own treatments — the shape
  // GET /clinics/{id}/catalog returns for real (see api.ts).
  var CARDS = [
    {
      practitioner: { id: 'demo-prac-1', he: 'ד"ר כהן', en: 'Dr. Cohen' },
      treatments: [
        {
          id: 'demo-apt-1', he: 'ייעוץ', en: 'Consultation',
          descriptionHe: 'שיחת ייעוץ ראשונית להכרת הצרכים שלך',
          descriptionEn: 'An initial consultation to understand your needs',
          price: '150.00',
        },
      ],
    },
    {
      practitioner: { id: 'demo-prac-2', he: 'ד"ר לוי', en: 'Dr. Levi' },
      treatments: [
        { id: 'demo-apt-2', he: 'ניקוי שיניים', en: 'Cleaning', price: '0' },
      ],
    },
  ];

  // SOURCE: demo.ts — demoAvailability(). DELIBERATE DIVERGENCE: demo.ts picks
  // fixed days-of-month (3, 5, 8, 12, 19, 26) with no weekday logic, so in any
  // month where those fall on Saturday the demo offers Shabbat appointments —
  // in September 2026 four of the six did, and the walked-through booking
  // landed on Shabbat at 10:30. An Israeli clinic works Sunday to Thursday, so
  // these are generated from the real calendar instead of hardcoded.
  // The same bug exists upstream in demo.ts and wants fixing there too.
  var CLINIC_DAYS = [0, 1, 2, 3, 4]; // Sun–Thu. Fri/Sat closed.
  var SLOT_SETS = [
    [{ start: '09:00', end: '09:30' }, { start: '11:00', end: '11:30' }, { start: '14:00', end: '14:30' }],
    [{ start: '10:30', end: '11:00' }, { start: '15:00', end: '15:30' }],
    [{ start: '09:30', end: '10:00' }, { start: '13:00', end: '13:30' }, { start: '16:00', end: '16:30' }],
  ];

  // Every other open day in the displayed month, up to six — enough to look
  // like a real diary without listing every weekday.
  function availabilityFor(monthOffset) {
    if (monthOffset > MAX_MONTH_OFFSET) return [];
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + monthOffset;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var day = monthOffset === 0 ? now.getDate() + 1 : 1;
    var out = [];
    var open = 0;
    for (; day <= daysInMonth && out.length < 6; day++) {
      var date = new Date(year, month, day);
      if (CLINIC_DAYS.indexOf(date.getDay()) < 0) continue;
      if (open++ % 2) continue;
      out.push({ date: iso(date), slots: SLOT_SETS[out.length % SLOT_SETS.length] });
    }
    return out;
  }

  function demoDate(daysFromNow) {
    var d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return iso(d);
  }

  // The first genuinely bookable day, so the booking the demo walks through is
  // never on a day the clinic is shut. The fallback only fires if a month
  // somehow yields no open days.
  var DEMO_DAY = availabilityFor(0)[0] || { date: demoDate(3), slots: SLOT_SETS[0] };

  // SOURCE: demo.ts — DEMO_PREFILL, plus createAppointment()'s returned id.
  // Pre-made selections so any step can be jumped straight to (see setScene),
  // and so the visitor never has to type to reach the end of the flow.
  var DEMO_PREFILL = {
    cardIndex: 0,
    treatmentIndex: 0,
    day: DEMO_DAY,
    time: (DEMO_DAY.slots[1] || DEMO_DAY.slots[0]).start,
    firstName: 'ישראל',
    lastName: 'ישראלי',
    phone: '050-123-4567',
    email: 'demo@orliclinic.com',
    bookingId: 'demo-booking-001',
  };

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
  // The widget owns its own language, exactly like the real product does: the
  // marketing site around it is Hebrew-only with no toggle (see PRODUCT.md),
  // so there is no site language to follow. he → rtl, en → ltr; one value,
  // the whole layout follows.
  var LANG = 'he';
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
  function formatPrice(price) {
    if (Number(price) === 0) return S.freePrice;
    return [price + ' ₪', '₪' + price];
  }

  // ---- widget instance ----
  function mount(root) {
    var st = null;
    function reset() {
      st = {
        step: 'catalog', card: null, treatment: null, practitioner: null,
        monthOffset: 0, day: null, time: '',
        // Pre-filled with the real demo build's placeholder identity so this
        // needs zero typing — the Israeli "John Doe". Editable, but ready to
        // click straight through. Stays Hebrew in both languages, matching
        // demo.ts, which does not translate it either.
        firstName: DEMO_PREFILL.firstName,
        lastName: DEMO_PREFILL.lastName,
        phone: DEMO_PREFILL.phone,
        email: DEMO_PREFILL.email,
        consent: false,
        otp: '', otpSent: false, otpError: false, resendWait: 0, submitting: false, bookingId: null,
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

    var lastStep = null;

    function render() {
      var showProgress = st.step !== 'success';
      var idx = STEP_ORDER.indexOf(st.step);
      var controls = '';
      if (showProgress) {
        var segs = '';
        for (var n = 0; n < 5; n++) segs += '<span class="obw-progress-seg' + (n <= idx ? ' is-on' : '') + '"></span>';
        var globeSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
        var langLabel = LANG === 'he' ? 'עב' : 'EN';
        // SOURCE: App.vue — the progress bar there carries role="progressbar"
        // and a text valuetext. Here the whole row sat inside aria-hidden,
        // which hid the only "which step am I on" signal from assistive tech
        // while leaving the language button focusable and operable anyway
        // (WCAG 4.1.2).
        var stepNow = idx + 1;
        var progressLabel = LANG === 'he'
          ? 'שלב ' + stepNow + ' מתוך 5'
          : 'Step ' + stepNow + ' of 5';
        controls = '<div class="obw-controls">' +
          '<button class="obw-lang-btn" type="button" data-lang aria-label="' +
            (LANG === 'he' ? 'החלפת שפה' : 'Switch language') + '">' +
            globeSvg + '<span>' + langLabel + '</span></button>' +
          '<div class="obw-progress" role="progressbar" aria-valuemin="1" aria-valuemax="5"' +
            ' aria-valuenow="' + stepNow + '" aria-valuetext="' + progressLabel + '">' +
            segs + '</div>' +
        '</div>';
      }
      // Mirror direction to match language (rtl for Hebrew).
      root.setAttribute('dir', dir());
      root.innerHTML =
        '<div class="obw-widget">' +
          controls +
          '<main class="obw-step">' + stepHtml() + '</main>' +
        '</div>';
      wire();
      // Let a host (scrolly.js) follow along when the visitor clicks their own
      // way through the widget. Fires only on an actual step change, so a
      // host that drives us via setScene() can ignore the echo of its own
      // call by tracking the step it last asked for.
      if (st.step !== lastStep) {
        lastStep = st.step;
        if (typeof handle.onStep === 'function') handle.onStep(st.step);
      }
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

    // The real widget is a standalone surface, so its step title is an <h1>.
    // Mounted inside a marketing page that already has one, that yields a
    // second <h1> and an h1 -> h3 jump, so the demo mount downgrades it.
    var TITLE_TAG = root.hasAttribute('data-scrolly') ? 'h2' : 'h1';
    function title(inner) {
      return '<' + TITLE_TAG + ' class="obw-title">' + inner + '</' + TITLE_TAG + '>';
    }

    function backBtn() {
      // "Back" points toward the start edge, which mirrors with direction.
      var chev = LANG === 'he' ? '›' : '‹';
      return '<button class="obw-back-btn" data-back>' + chev + ' ' + bi(S.back) + '</button>';
    }

    function catalogHtml() {
      var html = title(bi(S.bookTitle)) + '<div class="obw-list">';
      CARDS.forEach(function (card, ci) {
        html += '<section class="obw-card"><h2 class="obw-card-title">' +
          bi([card.practitioner.he, card.practitioner.en]) + '</h2><div class="obw-list">';
        card.treatments.forEach(function (tr, ti) {
          var description = tr.descriptionHe || tr.descriptionEn
            ? '<span class="obw-option-description">' + bi([tr.descriptionHe || '', tr.descriptionEn || '']) + '</span>'
            : '';
          var price = tr.price != null
            ? '<span class="obw-option-price">' + bi(formatPrice(tr.price)) + '</span>'
            : '';
          html += '<button class="obw-option" data-offering="' + ci + ':' + ti + '">' +
            '<span class="obw-option-content">' + bi([tr.he, tr.en]) + description + price + '</span>' +
            '</button>';
        });
        html += '</div></section>';
      });
      return html + '</div>';
    }

    function dateHtml() {
      var days = availabilityFor(st.monthOffset);
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
      return backBtn() + title(bi(S.chooseDate)) +
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
      return backBtn() + title(bi(S.chooseTime)) +
        '<p class="obw-muted">' + bi(formatDate(st.day.date)) + '</p>' +
        '<div class="obw-slots">' + slots + '</div>';
    }

    function field(key, name, value, type) {
      return '<label class="obw-field">' + bi(S[key]) +
        '<input data-field="' + name + '" type="' + (type || 'text') + '" value="' + esc(value) + '" /></label>';
    }

    function patientHtml() {
      return '<div class="obw-patient-step">' + backBtn() + title(bi(S.yourDetails)) +
        '<form class="obw-patient-form" data-patient>' +
          field('firstName', 'firstName', st.firstName) +
          field('lastName', 'lastName', st.lastName) +
          field('phone', 'phone', st.phone, 'tel') +
          field('email', 'email', st.email, 'email') +
          '<label class="obw-consent"><input type="checkbox" data-field="consent"' + (st.consent ? ' checked' : '') + ' />' +
            bi(S.marketingConsent) + '</label>' +
          '<p class="obw-error" data-form-error role="alert"></p>' +
          '<button type="submit" class="obw-primary-btn obw-primary-btn--compact" data-continue>' + bi(S.continue) + '</button>' +
        '</form></div>';
    }

    function confirmHtml() {
      var dateLabel = formatDate(st.day.date)[LANG === 'he' ? 0 : 1];
      var priceRow = st.treatment.price != null
        ? '<dt>' + bi(S.price) + '</dt><dd>' + bi(formatPrice(st.treatment.price)) + '</dd>'
        : '';
      var summary = '<dl class="obw-summary">' +
        '<dt>' + bi(S.treatment) + '</dt><dd>' + bi([st.treatment.he, st.treatment.en]) + '</dd>' +
        priceRow +
        '<dt>' + bi(S.practitioner) + '</dt><dd>' + bi([st.practitioner.he, st.practitioner.en]) + '</dd>' +
        '<dt>' + bi(S.when) + '</dt><dd>' + bdi(dateLabel + ' · ' + st.time) + '</dd>' +
        '<dt>' + bi(S.yourDetails) + '</dt><dd>' +
          bdi(st.firstName + ' ' + st.lastName + ' · ' + st.phone + ' · ' + st.email) + '</dd>' +
      '</dl>';
      var otpBox = st.otpSent ? (
        '<div class="obw-otp">' +
          '<p class="obw-otp-hint">' + bi(fill(S.otpSentTo, { email: st.email })) + '</p>' +
          '<p class="obw-otp-hint" style="color:var(--obw-primary)">' + bi(S.otpDemoHint) + '</p>' +
          '<label class="obw-field">' + bi(S.otpCode) +
            '<input data-otp inputmode="numeric" maxlength="6" value="' + esc(st.otp) + '" /></label>' +
          '<button type="button" class="obw-resend-btn" data-resend' + (st.resendWait > 0 ? ' disabled' : '') + '>' +
            bi(S.resendCode) + '<span data-resend-wait>' + (st.resendWait > 0 ? ' (' + st.resendWait + ')' : '') + '</span></button>' +
        '</div>' +
        (st.otpError ? '<p class="obw-error">' + bi(S.wrongOtpError) + '</p>' : '')
      ) : '';
      var footer = '<div class="obw-confirm-footer">' + (
        !st.otpSent
          ? '<button class="obw-primary-btn obw-primary-btn--compact" data-send-otp>' + bi(S.sendOtp) + '</button>'
          : '<button class="obw-primary-btn obw-primary-btn--compact" data-confirm' + (st.submitting || !/^\d{6}$/.test(st.otp.trim()) ? ' disabled' : '') + '>' +
              bi(st.submitting ? S.booking : S.confirm) + '</button>'
      ) + '</div>';
      return '<div class="obw-confirm-step">' + backBtn() + title(bi(S.confirmTitle)) +
        summary + otpBox + footer + '</div>';
    }

    function successHtml() {
      var dateLabel = formatDate(st.day.date)[LANG === 'he' ? 0 : 1];
      var priceRow = st.treatment.price != null
        ? '<dt>' + bi(S.price) + '</dt><dd>' + bi(formatPrice(st.treatment.price)) + '</dd>'
        : '';
      return title(bi(S.bookedTitle)) +
        '<dl class="obw-summary">' +
          '<dt>' + bi(S.treatment) + '</dt><dd>' + bi([st.treatment.he, st.treatment.en]) + '</dd>' +
          priceRow +
          '<dt>' + bi(S.practitioner) + '</dt><dd>' + bi([st.practitioner.he, st.practitioner.en]) + '</dd>' +
          '<dt>' + bi(S.when) + '</dt><dd>' + bdi(dateLabel + ' · ' + st.time) + '</dd>' +
          '<dt>' + bi(S.firstName) + '</dt><dd>' + bdi(st.firstName + ' ' + st.lastName) + '</dd>' +
          '<dt>' + bi(S.phone) + '</dt><dd>' + bdi(st.phone) + '</dd>' +
          '<dt>' + bi(S.email) + '</dt><dd>' + bdi(st.email) + '</dd>' +
        '</dl>' +
        // DEMO-ONLY exit — see S.restartDemo. Without it the last scene of the
        // scrollytelling flow has no controls at all and reads as a hang.
        '<div class="obw-success-actions">' +
          '<button type="button" class="obw-restart-btn" data-restart>' + bi(S.restartDemo) + '</button>' +
        '</div>';
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
        if (st.step === 'confirm') st.otpSent = false;
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
          st.otp = ''; st.otpSent = false; st.otpError = false; st.step = 'confirm'; render();
        });
      }
      var otp = root.querySelector('[data-otp]');
      if (otp) otp.addEventListener('input', function () {
        st.otp = otp.value.replace(/\D/g, '').slice(0, 6);
        otp.value = st.otp;
        var cb = root.querySelector('[data-confirm]');
        if (cb) cb.disabled = st.submitting || !/^\d{6}$/.test(st.otp);
      });
      var sendOtpBtn = root.querySelector('[data-send-otp]');
      if (sendOtpBtn) sendOtpBtn.addEventListener('click', function () {
        st.otpSent = true; render(); startResend();
      });
      var resend = root.querySelector('[data-resend]');
      if (resend) resend.addEventListener('click', function () { st.otp = ''; render(); startResend(); });
      var restartBtn = root.querySelector('[data-restart]');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        reset();
        render();
        // Hand control back to whatever is hosting us. The pointerdown that
        // opened this click has already told scrolly.js the visitor took over,
        // and without this the scroll narrative would stay switched off and
        // the widget would sit on the catalog step doing nothing.
        root.dispatchEvent(new CustomEvent('orli:restart', { bubbles: true }));
      });
      var langBtn = root.querySelector('[data-lang]');
      if (langBtn) langBtn.addEventListener('click', function () {
        LANG = LANG === 'he' ? 'en' : 'he';
        root.setAttribute('dir', LANG === 'he' ? 'rtl' : 'ltr');
        render();
      });
      var confirm = root.querySelector('[data-confirm]');
      if (confirm) confirm.addEventListener('click', function () {
        if (!/^\d{6}$/.test(st.otp.trim())) return;
        st.submitting = true; render();
        setTimeout(function () {
          st.submitting = false;
          st.bookingId = DEMO_PREFILL.bookingId;
          clearInterval(timer);
          st.step = 'success'; render();
        }, 900);
      });
      // No restart button on success page in current design.
    }

    function validPatient() {
      return st.firstName.trim() && st.lastName.trim() && st.phone.trim().length >= 7 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim());
    }
    // An error that only recolours a border names neither the problem nor the
    // recovery, and a red edge is invisible to anyone who cannot see the hue.
    // Mark the fields, then say which ones in words.
    function flashInvalid(form) {
      // Two lists, not one: bi() renders a Hebrew line and an English line, so
      // each needs the field names in its own language. Filling one list into
      // both leaves the English line reading "Please complete: שם פרטי".
      var missingHe = [], missingEn = [];
      form.querySelectorAll('[data-field]').forEach(function (inp) {
        if (inp.type === 'checkbox') return;
        var key = inp.getAttribute('data-field');
        var val = String(inp.value).trim();
        var bad = key === 'email'
          ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)
          : key === 'phone' ? val.length < 7 : !val;
        inp.classList.toggle('obw-invalid', bad);
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && S[key]) { missingHe.push(S[key][0]); missingEn.push(S[key][1]); }
      });
      var box = form.querySelector('[data-form-error]');
      if (box) {
        box.innerHTML = missingHe.length
          ? bi([S.fixFields[0].replace('{fields}', missingHe.join(', ')),
                S.fixFields[1].replace('{fields}', missingEn.join(', '))])
          : '';
      }
    }

    // Scroll-driven "scenes": jump the widget to a given step with all the
    // prior selections pre-made, so a scrollytelling section can walk it
    // through the whole booking flow without any clicks.
    // SOURCE: App.vue — the `?demo` postMessage handler (search DEMO_PREFILL
    // there). Same idea: jump to a step with every prior selection already
    // made, so the scrollytelling section can walk the whole flow with no
    // clicks. Keep the two in step when App.vue's handler changes.
    function setScene(i) {
      reset();
      var card = CARDS[DEMO_PREFILL.cardIndex];
      var order = ['catalog', 'date', 'time', 'patient', 'confirm', 'success'];
      st.step = order[Math.max(0, Math.min(order.length - 1, i))];
      if (st.step !== 'catalog') {
        st.card = card;
        st.practitioner = card.practitioner;
        st.treatment = card.treatments[DEMO_PREFILL.treatmentIndex];
      }
      if (['time', 'patient', 'confirm', 'success'].indexOf(st.step) >= 0) {
        st.day = DEMO_PREFILL.day;
        st.time = DEMO_PREFILL.time;
      }
      if (['confirm', 'success'].indexOf(st.step) >= 0) { st.otp = '123456'; st.otpSent = true; }
      if (st.step === 'success') st.bookingId = DEMO_PREFILL.bookingId;
      render();
    }

    var handle = { setScene: setScene, render: render, onStep: null };
    render();
    return handle;
  }

  function init() {
    var widgets = [].slice.call(document.querySelectorAll('[data-orli-widget]'));
    widgets.forEach(function (el) {
      el.classList.add('orli-live');
      // The compaction ruleset in widget.css is gated on [data-scrolly]; it
      // exists so the tallest scene (confirm) fits the pinned card without an
      // inner scrollbar. Only the pinned #demo mount wants it — a widget
      // embedded anywhere else should render at full size.
      if (el.closest && el.closest('#demo')) el.setAttribute('data-scrolly', '');
      el.__orli = mount(el);
    });
    // No <html lang> observer: the site is Hebrew-only and nothing flips it.
    // The widget's own [data-lang] button is the only language control.
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
