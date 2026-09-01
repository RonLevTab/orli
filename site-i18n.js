/* ============================================================
   Whole-site language switch: English (LTR) ⇄ Hebrew (RTL).

   Best practice in three moves:
     1. Flip ONE thing — <html dir> + <html lang>. The CSS uses
        logical properties, so the whole layout mirrors itself.
     2. Swap text by key. English is the source of truth in the
        HTML and is captured on load, so this file only carries
        the Hebrew overrides.
     3. Keep Latin runs (email, code, URLs) isolated as LTR.

   Marked up in index.html with data-i18n="key" (text/innerHTML)
   and data-i18n-ph="key" (input placeholder).
   ============================================================ */
(function () {
  'use strict';

  // Hebrew overrides only — English is read straight from the DOM.
  var HE = {
    'util.tagline': 'בנוי על פלטפורמת Optima',
    'util.support': 'תמיכה',

    'brand.sub': '· ל‑Optima',
    'nav.demo': 'דמו חי',
    'nav.how': 'איך זה עובד',
    'nav.why': 'למה Orli',
    'nav.features': 'יכולות',
    'nav.security': 'אבטחה',
    'nav.faq': 'שאלות נפוצות',
    'nav.book': 'לקביעת דמו',

    'hero.eyebrow': 'תוסף למרפאות שעובדות עם Optima',
    'hero.h1': 'ברגע שמטופל<br />רוצה תור,<br /><span class="ital">Orli קובעת אותו.</span>',
    'hero.lead': 'Optima מנהלת את המרפאה, אבל היומן שלה אף פעם לא היה פתוח למטופלים, אז הם עדיין מתקשרים או מגיעים פיזית כדי לקבוע תור. Orli היא <em>התוסף שמשנה את זה</em>. כלי פשוט לקביעת תורים באתר המרפאה מאפשר למטופלים לקבוע תור אונליין, וכל תור נכנס ישירות ל‑Optima. בלי להחליף כלום, בלי מערכת חדשה שהצוות צריך ללמוד.',
    'hero.btnDemo': 'לדמו החי',
    'hero.btnHow': '← איך זה עובד',
    'hero.trust1': '<strong>בלי הקלדה מחדש.</strong> התורים נכנסים ישירות ל‑Optima.',
    'hero.trust2': '<strong>בלי חשבונות למטופלים.</strong> רק קוד לנייד שלהם.',
    'hero.trust3': '<strong>בלי תחזוקה.</strong> מוסיפים פעם אחת, וזה נשאר מעודכן.',

    'mock.service': 'בחרו טיפול',
    'mock.checkup': 'בדיקה',
    'mock.cleaning': 'ניקוי אבנית',
    'mock.consult': 'ייעוץ',
    'mock.date': 'יום שלישי, 28 ביולי',
    'mock.confirm': '← אישור 10:30',
    'mock.verified': 'מאומת בקוד שנשלח לנייד',
    'mock.badge1': '✓ אוטומציה מלאה ל‑Optima',
    'mock.badge2': '🔒 מאובטח · מהיר · פשוט',

    'stat.1': 'מ״אני צריך תור״ ועד תור מאושר',
    'stat.2': 'קביעת תורים, הרבה אחרי שהמזכירה הולכת הביתה',
    'stat.3': 'הקלדות ידניות ל‑Optima',
    'stat.4': 'שורת קוד להטמעה בכל אתר מרפאה',

    'scrolly.eyebrow': 'רואים את זה בפעולה',
    'scrolly.h2': 'צפו בתור נקבע, <span class="ital">בזמן אמת.</span>',
    'scrolly.lead': 'גללו, והוידג׳ט האמיתי קובע תור שלב אחר שלב, בדיוק כמו שהמטופלים שלכם היו עושים. הוא חי, אז אפשר גם לנסות אותו בעצמכם.',
    'scrolly.0.idx': '01 · רופא/ה',
    'scrolly.0.h': 'בחירת רופא/ה',
    'scrolly.0.p': 'המטופל נכנס לאתר שלכם ובוחר את הרופא/ה המתאימ/ה. הרשימה מגיעה חי מ‑Optima.',
    'scrolly.1.idx': '02 · טיפול',
    'scrolly.1.h': 'בחירת טיפול',
    'scrolly.1.p': 'לאחר בחירת הרופא/ה, המטופל בוחר את הטיפול הרצוי מתוך רשימת הטיפולים שלו/ה.',
    'scrolly.2.idx': '03 · תאריך',
    'scrolly.2.h': 'בחירת יום',
    'scrolly.2.p': 'Orli מציגה רק ימים עם זמינות אמיתית, לפי השעות והימים החופשיים של כל רופא, כך שזו אף פעם לא שעה שאינה באמת פנויה.',
    'scrolly.3.idx': '04 · שעה',
    'scrolly.3.h': 'בחירת שעה',
    'scrolly.3.p': 'השעות הפנויות לאותו יום מופיעות מיד, ישירות מהיומן החי.',
    'scrolly.4.idx': '05 · פרטים',
    'scrolly.4.h': 'מי קובע את התור',
    'scrolly.4.p': 'שם וטלפון, פעם אחת. מספר הטלפון הוא כל הזיהוי שצריך, אז אין חשבון לפתוח ואין מה לזכור.',
    'scrolly.5.idx': '06 · אימות',
    'scrolly.5.h': 'אימות בקוד',
    'scrolly.5.p': 'קוד מהיר מאמת את המטופל ממש לפני ש‑Orli קובעת משהו. זה חוסם ספאם וזה המקום שבו נאספת ההסכמה.',
    'scrolly.6.idx': '07 · נקבע',
    'scrolly.6.h': 'נכתב ל‑Optima',
    'scrolly.6.p': 'התור נוחת ביומן האמיתי שלכם והמטופל מקבל אישור. בלי הקלדה מחדש, בלי טלפונים חוזרים. זהו.',
    'scrolly.caption': 'חי ואינטראקטיבי. גללו, או הקישו על הוידג׳ט בעצמכם.',

    'prob.eyebrow': 'צוואר הבקבוק',
    'prob.h2': 'כל תור עובר<br /><span class="ital">דרך המזכירה.</span>',
    'prob.lead': 'היומן של Optima נבנה לצוות שלכם, לא למטופלים אונליין. אז הם עדיין מתקשרים או מגיעים פיזית כדי לקבוע תור, והמזכירה מקלידה כל תור ביד. Orli פותחת את אותו יומן לאתר שלכם, בלי להחליף שום דבר שאתם כבר מריצים.',

    'how.eyebrow': 'איך זה עובד',
    'how.h2': 'שלושה צעדים, <span class="ital">בלי טלפון.</span>',
    'how.lead': 'ממטופל שלוחץ "לקביעת תור" ועד תור אמיתי ב‑Optima. זה כל המסלול.',
    'how.s1.h': 'המטופל בוחר שעה פנויה',
    'how.s1.p': 'כלי הקביעה מציג שעות פנויות אמיתיות מ‑Optima, אותן שעות שהצוות רואה.',
    'how.s1.c1': 'זמינות חיה',
    'how.s1.c2': 'תורים אמיתיים',
    'how.s2.h': 'מאשר בקוד לנייד',
    'how.s2.p': 'קוד מהיר שנשלח לנייד מאמת את המטופל. בלי סיסמאות, בלי חשבונות לנהל.',
    'how.s2.c1': 'קוד חד‑פעמי',
    'how.s2.c2': 'בלי חשבון',
    'how.s3.h': 'נקבע ב‑Optima',
    'how.s3.p': 'התור נכנס ישירות ליומן שלכם, וכולם מקבלים אישור.',
    'how.s3.c1': 'ישר ל‑Optima',
    'how.s3.c2': 'אישור נשלח',

    'cmp.eyebrow': 'מטלפונים חוזרים לתור סגור',
    'cmp.h2': 'הדרך הידנית <span class="ital">מול Orli.</span>',
    'cmp.lead': 'אותה מרפאה, אותו יומן Optima. אחת מהאפשרויות משאירה את המזכירה על הטלפון כל הבוקר.',
    'cmp.without.head': 'בלי Orli',
    'cmp.without.1': 'המטופלים מתקשרים בשעות הפעילות, או בכלל לא',
    'cmp.without.2': 'המזכירה מקריאה תורים, רושמת ומקלידה ל‑Optima',
    'cmp.without.3': 'שינוי מועד = עוד שיחה ועוד עריכה ידנית',
    'cmp.without.4': 'בקשות אחרי שעות הפעילות ממתינות בתא הקולי',
    'cmp.without.5': 'אין תיעוד של מי ניסה לקבוע תור וּויתר',
    'cmp.with.head': 'עם Orli',
    'cmp.with.1': 'המטופל קובע תור אונליין בפחות מדקה, בכל שעה',
    'cmp.with.2': 'התור נכנס ישירות ל‑Optima, בלי הקלדה מחדש',
    'cmp.with.3': 'מטופלים משנים מועד ומבטלים בעצמם, עם אימות בקוד',
    'cmp.with.4': 'התורים מטופלים ברגע שהם מגיעים, 24/7',
    'cmp.with.5': 'כל תור נרשם למסד הנתונים שלכם מהיום הראשון',

    'feat.eyebrow': 'מה מקבלים',
    'feat.h2': 'כל מה שהמזכירה <span class="ital">מייחלת ש‑Optima תדע לעשות.</span>',
    'feat.1.h': 'תמיד מעודכן',
    'feat.1.p': 'השעות מגיעות ישירות מ‑Optima, לפי השעות והימים החופשיים של כל רופא. המטופלים רואים רק שעות שבאמת פנויות.',
    'feat.2.h': 'המטופלים מסתדרים לבד',
    'feat.2.p': 'הם יכולים לקבוע, לשנות מועד ולבטל בעצמם, עם אישור בקוד לנייד. פחות שיחות, פחות אי‑הגעות, פחות מחיקות על הלוח.',
    'feat.3.h': 'מוסיפים תוך דקות',
    'feat.3.p': 'איש האינטרנט שלכם מוסיף את זה פעם אחת. זה מתאים לכל אתר מרפאה ולא מתנגש עם העיצוב שלכם.',
    'feat.4.h': 'מרפאה אחת או הרבה',
    'feat.4.p': 'הפעילו מרפאה אחת או רשת שלמה, לכל אחת יומן משלה, מאותו מקום.',
    'feat.5.h': 'כל תור, נשמר',
    'feat.5.p': 'כל תור נשמר עבורכם מהיום הראשון, כך שתוכלו לראות איך המרפאה באמת עובדת.',
    'feat.6.h': 'מהיר ואמין',
    'feat.6.p': 'הקביעה נשארת מהירה ואמינה למטופלים שלכם, גם ביום העמוס ביותר.',

    'emb.eyebrow': 'קל להוסיף',
    'emb.h2': 'באתר שלכם <span class="ital">תוך דקות.</span>',
    'emb.lead': 'איש האינטרנט שלכם מוסיף את Orli לאתר פעם אחת. אחרי זה העדכונים קורים לבד, כך שאין לכם מה לתחזק.',
    'emb.li1': 'עובד עם כל אתר מרפאה',
    'emb.li2': 'לא משנה את המראה של שאר האתר',
    'emb.li3': 'נעול למרפאה שלכם, מוגן משימוש לרעה',

    'sec.eyebrow': 'אמון ופרטיות',
    'sec.h2': 'בנוי כדי לשמור על <span class="ital">פרטי המטופלים.</span>',
    'sec.lead': 'Orli מטפלת במידע על מטופלים בזהירות. הנה מה שזה אומר עבורכם, בפשטות.',
    'sec.1.h': '🔐 הנתונים של המטופלים נשארים פרטיים',
    'sec.1.p': 'פרטי המטופלים לעולם לא נחשפים באתר הציבורי שלכם. כל מה שרגיש מטופל בצורה מאובטחת מאחורי הקלעים.',
    'sec.2.h': '📱 בלי חשבונות, בלי סיסמאות',
    'sec.2.p': 'המטופלים מאשרים בקוד מהיר שנשלח לנייד שלהם. אין מה להירשם, אין סיסמה לשכוח, וזה חוסם ספאם.',
    'sec.3.h': '🚧 אף פעם לא תור כפול',
    'sec.3.p': 'אם משהו משתבש, Orli מבקשת מהמטופל לנסות שוב במקום לסכן תור שגוי או כפול.',
    'sec.4.h': '🧾 רק מה שצריך',
    'sec.4.p': 'Orli מבקשת רק את מה שצריך כדי לקבוע את התור, ופועלת לפי כללי הפרטיות של מערכת הבריאות בישראל.',

    'road.eyebrow': 'בקרוב',
    'road.h2': 'בקרוב תנהלו את Optima <span class="ital">פשוט בדיבור.</span>',
    'road.lead': 'וידג׳ט קביעת התורים כבר חי היום. בשלב הבא: עוזר AI וצ׳אטבוט שיאפשרו לצוות ולמטופלים לנהל את כל היומן ב‑Optima בשפה חופשית.',
    'road.tag.live': 'חי עכשיו',
    'road.tag.live2': 'חי עכשיו',
    'road.tag.next': 'בקרוב',
    'road.tag.later': 'בקרוב',
    'road.r1.h': 'המטופלים קובעים בעצמם',
    'road.r1.p': 'המטופלים קובעים שעות פנויות אמיתיות אונליין וזה נוחת ב‑Optima. הבסיס המוכח שכל השאר נבנה עליו.',
    'road.r2.h': 'שינוי מועד וביטול',
    'road.r2.p': 'המטופלים משנים או מבטלים את התורים שלהם בעצמם, עם אישור בקוד לנייד. בלי עבודה למזכירה.',
    'road.r3.h': '🤖 מדברים אל היומן',
    'road.r3.p': 'הרופאים והצוות פשוט אומרים מה שצריך, למשל ״תקבע לה בדיקה בעוד שלושה שבועות״, והעוזר החכם מסדר את זה ב‑Optima. בלי טפסים, בלי קליקים.',
    'road.r4.h': '💬 צ׳אטבוט שקובע תורים למטופלים',
    'road.r4.p': 'המטופלים משוחחים בשפה חופשית כדי לקבוע, לשנות או לבטל תור בכל שעה, וזה זורם ישר ל‑Optima.',
    'road.note': 'כל היומן ב‑Optima, מנוהל בשפה חופשית גם על ידי הצוות וגם על ידי המטופלים. רוצים גישה מוקדמת כשזה יוצא? <a href="#contact">דברו איתנו.</a>',

    'faq.eyebrow': 'שאלות נפוצות',
    'faq.h2': 'כמה דברים שצוותים שואלים <span class="ital">לפני שמתחילים.</span>',
    'faq.q1': 'חייבים להחליף את Optima?',
    'faq.tag1': 'אינטגרציה',
    'faq.a1': 'לא. Orli יושבת מעל יומן ה‑Optima שכבר יש לכם. שום דבר לא משתנה לצוות. עבודת הקביעה הידנית פשוט נעלמת.',
    'faq.q2': 'כמה זמן לוקח להתחיל?',
    'faq.tag2': 'הטמעה',
    'faq.a2': 'ימים, לא חודשים. אנחנו מתחברים ל‑Optima שלכם, מגדירים את השירותים והרופאים, ונותנים לכם קטע קוד פשוט להוסיף לאתר.',
    'faq.q3': 'המזכירה מאבדת שליטה על היומן?',
    'faq.tag3': 'שליטה',
    'faq.a3': 'לעולם לא. מטופלים קובעים רק לתוך תורים פנויים אמיתיים שהכללים שלכם כבר מתירים. הצוות ממשיך לעבוד ב‑Optima בדיוק כמו היום.',
    'faq.q4': 'נתוני המטופלים בטוחים באתר ציבורי?',
    'faq.tag4': 'אבטחה',
    'faq.a4': 'כן. פרטי המטופלים לעולם לא נחשפים באתר הציבורי שלכם. כל תור מאושר בקוד שנשלח לנייד של המטופל, ונשמר עבורכם.',
    'faq.q5': 'מה אם שני מטופלים תופסים אותו תור?',
    'faq.tag5': 'אמינות',
    'faq.a5': 'אם שני אנשים מנסים לתפוס אותה שעה, Orli מזהה ומציעה את השעה הפנויה הבאה, כך שאף אחד לא יוצא במחשבה שהוא קבע כשלא.',

    'cta.eyebrow': 'כשתהיו מוכנים',
    'cta.h2': 'הפכו את יומן ה‑Optima <span class="ital">למנוע קביעת תורים.</span>',
    'cta.lead': 'ראו את Orli קובעת תור אמיתי ליומן חי בפחות מדקה. ספרו לנו על המרפאה ונקבע הדגמה.',
    'cta.clinicLabel': 'שם המרפאה',
    'cta.clinicPh': 'מרפאת שיניים התוספים',
    'cta.emailLabel': 'אימייל בעבודה',
    'cta.emailPh': 'you@clinic.co.il',
    'cta.btn': 'בקשת דמו',

    'foot.tagline': 'קביעת תורים אונליין קלה למרפאות שמריצות Optima. מהאתר שלכם, ישר ליומן.',
    'foot.col1.h': 'מוצר',
    'foot.col1.1': 'איך זה עובד',
    'foot.col1.2': 'יכולות',
    'foot.col1.3': 'מפת דרכים',
    'foot.col2.h': 'אמון',
    'foot.col2.1': 'אבטחה',
    'foot.col2.2': 'שאלות נפוצות',
    'foot.col2.3': 'צור קשר',
    'foot.col3.h': 'בואו נתחיל',
    'foot.col3.1': 'לקביעת דמו',
    'foot.col3.2': 'למה Orli',
    'foot.bottom1': '© <span id="year"></span> Orli. בנוי על פלטפורמת Optima.',
    'foot.bottom2': 'נבנה למרפאות בישראל · מגשרים על הישן, בעדינות.',
  };

  var html = document.documentElement;
  var textEls = [].slice.call(document.querySelectorAll('[data-i18n]'));
  var phEls = [].slice.call(document.querySelectorAll('[data-i18n-ph]'));

  // English is the source of truth: capture it once from the DOM.
  var EN = {};
  textEls.forEach(function (el) { EN[el.getAttribute('data-i18n')] = el.innerHTML; });
  var ENph = {};
  phEls.forEach(function (el) { ENph[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder'); });

  function setYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function apply(lang) {
    var dict = lang === 'he' ? HE : EN;
    textEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = lang === 'he' ? HE[key] : EN[key];
      if (val != null) el.innerHTML = val;
    });
    phEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      var val = lang === 'he' ? HE[key] : ENph[key];
      if (val != null) el.setAttribute('placeholder', val);
    });
    html.setAttribute('lang', lang);
    // Proper RTL for Hebrew so it reads naturally (right-aligned). The layout
    // flip is hidden by the loading animation on toggle, so it isn't jarring.
    html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    setYear(); // innerHTML swap re-created the year span; refill it.

    var btn = document.getElementById('langToggle');
    if (btn) {
      btn.textContent = lang === 'he' ? 'EN' : 'עב';
      btn.setAttribute('aria-label', lang === 'he' ? 'Switch to English' : 'החלפה לעברית');
    }
    try { localStorage.setItem('orli-lang', lang); } catch (e) {}
  }

  var start = 'en';
  try { start = localStorage.getItem('orli-lang') || 'en'; } catch (e) {}
  apply(start);

  // ---- language-switch loading animation ----
  // A brief (~1s) veil fades in, the swap + direction flip happen while hidden,
  // then it fades out — so the layout change never flashes in front of the user.
  var loader = document.createElement('div');
  loader.className = 'lang-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML =
    '<div class="lang-loader-box"><span class="lang-loader-ring"></span>' +
    '<span class="lang-loader-mark">O</span></div>';
  document.body.appendChild(loader);

  var switching = false;
  function switchLang(next) {
    if (switching) return;
    switching = true;
    loader.classList.add('on');                                    // veil fades in
    setTimeout(function () { apply(next); }, 340);                  // swap while covered
    setTimeout(function () { loader.classList.remove('on'); }, 980);// reveal
    setTimeout(function () { switching = false; }, 1300);
  }

  var btn = document.getElementById('langToggle');
  if (btn) {
    btn.addEventListener('click', function () {
      switchLang(html.getAttribute('lang') === 'he' ? 'en' : 'he');
    });
  }
})();
