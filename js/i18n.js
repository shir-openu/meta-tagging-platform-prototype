/* =====================================================
   i18n.js -- Hebrew and English, one page, one dataset.

   Not two sites. A parallel translated site drifts: within weeks one of them is stale and a
   reader who lands on the stale one is given wrong numbers, which is worse than not offering
   their language at all. So both languages live in the same page and read the same JSON, and
   the choice travels in the URL like every other piece of state.

   Hebrew is the default because the first readers are Israeli, and because the cases and
   senses were tagged bilingually from the start - the Hebrew is not a translation layer
   bolted on afterwards, it was stored with the data.

   What is NEVER translated: the quotes. A verbatim quote is evidence, and a translated
   quote is not the sentence the paper contains. Where a Hebrew rendering exists it is shown
   BESIDE the original, never instead of it.
   ===================================================== */

const I18N = {
  he: {
    dir: "rtl", lang: "he", other: "English", otherCode: "en",

    "site.title": "פלטפורמת מטא־תיוג",
    "site.proto": "אב טיפוס",
    "site.lede": "שכבת תיוג אחידה לספרות אקדמית, שבה <b>כל תג נושא את המשפט המדויק מהמאמר שממנו נגזר</b>. המטרה: להאיץ מחקר בין־תחומי — לחסוך את הצעד שבו נעצרים כשנכנסים לתחום זר.",

    "def.title": "מציאת הגדרה אופטימלית לפי קורפוס",
    "def.concept": "המושג: אומנות",
    "def.back": "← חזרה לפלטפורמה",
    "def.lede": "סמנו אילו מאמרים מרכיבים את הקורפוס שלכם. כל ההגדרות מדורגות מחדש מיד, וכל ציון נפתח לטבלת המקרים שהולידה אותו — כולל המשפט המדויק מהמאמר.",
    "def.point": "<b>המספר משתנה כשמשנים את הקורפוס — וזו כל הנקודה.</b> הגדרה אינה נכונה או שגויה בפני עצמה; היא מתאימה או לא מתאימה למה שספרות מסוימת אומרת. נסו להוריד חצי מהמאמרים ולראות מה קורה לדירוג.",

    "corpus.h": "הקורפוס שלך",
    "corpus.all": "הכל", "corpus.none": "כלום", "corpus.invert": "היפוך",
    "corpus.copy": "העתקת קישור", "corpus.copied": "הועתק ✓",
    "corpus.label": "הקורפוס שלך:",
    "corpus.papers": "מאמרים", "corpus.judged": "מקרים מוכרעים", "corpus.pos": "חיוביים",

    "dl.h": "מה אפשר להוריד",
    "dl.body": "כל מה שמוצג כאן מחושב בדפדפן משני הקבצים האלה. אפשר להוריד אותם ולבדוק אותנו בכלים משלכם — אין שרת ואין מה להסתיר.",

    "jack.btn": "מי מחזיק את התוצאה?",
    "jack.few": "צריך לפחות שלושה מאמרים בקורפוס כדי לבדוק מי מחזיק את התוצאה.",
    "jack.fragile": "<b>התוצאה שברירה.</b>",
    "jack.stable": "<b>התוצאה יציבה.</b> אין מאמר יחיד שהסרתו משנה את זהות ההגדרה המובילה",
    "jack.removing": "הסרת",
    "jack.papersChange": "מהמאמרים משנים את זהות ההגדרה המובילה.",
    "jack.paperChanges": "מהמאמרים משנה את זהות ההגדרה המובילה.",
    "jack.top5": "מוצגים חמשת המאמרים שהסרתם מזיזה הכי הרבה את הציון של המובילה",
    "jack.removes": "מסיר אותה מהראש →",
    "jack.keeps": "לא משנה את הראש",
    "jack.cases": "מקרים · שינוי בציון",

    "gate.ok": "עוברת", "gate.borderline": "גבולית", "gate.disqualified": "נפסלת",
    "case.tp": "צדקה", "case.tn": "צדקה",
    "case.fp": "קיבלה בטעות", "case.fn": "פסלה בטעות",
    "case.wrongN": "המקרים שההגדרה הזו טועה בהם — עם הציטוט מהמאמר",
    "case.none": "אין מקרה שההגדרה הזו טועה בו בקורפוס הזה.",
    "case.paper": "מאמר", "case.case": "מקרה",

    "calib.missing": "<b>אזהרה:</b> הבקרה המעגלית לא ניתנת לחישוב על הקורפוס הזה.",
    "calib.failed": "<b>אזהרה — הכיול נכשל.</b> הבקרה המעגלית קיבלה",
    "calib.instead": "במקום כמעט",
    "calib.why": "היא מעתיקה את התשובה, ולכן היא <b>חייבת</b> לקבל ציון כמעט מושלם. אם לא — הקידוד סותר את עצמו בקורפוס הזה, ואין לקרוא אף מספר אחר בטבלה.",

    "plain.90": "כמעט כל מקרה נופל בצד הנכון.",
    "plain.70": "מסכימה עם הספרות ברוב המכריע של המקרים.",
    "plain.50": "מסכימה עם הספרות לרוב, ונופלת במיעוט לא זניח.",
    "plain.25": "טובה מניחוש, אבל טועה בהרבה מקרים.",
    "plain.02": "כמעט אינה מבדילה בין מה שהספרות מקבלת לבין מה שהיא פוסלת.",
    "plain.00": "אינה מבדילה כלל — כמו הטלת מטבע.",
    "plain.neg": "נופלת בכיוון ההפוך מהספרות.",
    "plain.none": "אין די מקרים בקורפוס הזה כדי לחשב ציון.",

    "unscored.h": "למה יש מאמרים שאי אפשר לבחור",
    "unscored.body": "אלה מאמרים שכבר תויגו — יש להם מקרים וציטוטים — אבל טרם נוקדו מול ההגדרות. <b>ולא ננקד אותם בנפרד</b>: מדדנו שניסוח ההוראה לשופטים מזיז את ה־MCC בכ־0.12 לאותה הגדרה בדיוק, ולכן ציונים מהרצות שונות אינם ברי־השוואה. לצרף מקרים שנוקדו בהרצה אחרת היה מייצר טבלה שנראית גדולה יותר ואומרת פחות. הם ייפתחו כשכל הקורפוס ינוקד מחדש בהרצה אחת.",
    "limits.h": "מה אסור להסיק מהעמוד הזה.",
    "limits.body": "רווחי הסמך של ההגדרות המובילות חופפים — מותר לומר \"בין המובילות\", אסור לומר \"הראשונה\". התיוג נעשה במעבר אחד על ידי מקודדת אחת, ולכן מהימנות בין שני מקודדים בלתי־תלויים אינה מתקיימת ואיננו טוענות שהיא מתקיימת. ומספרים מהרצה אחת אינם ברי־השוואה למספרים מהרצה אחרת: מדדנו שניסוח ההוראה לשופטים מזיז את ה־MCC בכ־0.12 לאותה הגדרה בדיוק.",
  },

  en: {
    dir: "ltr", lang: "en", other: "עברית", otherCode: "he",

    "site.title": "Meta-Tagging Platform",
    "site.proto": "prototype",
    "site.lede": "A field-neutral tag layer for academic literature in which <b>every tag carries the exact sentence from the paper it was read from</b>. The purpose: to accelerate interdisciplinary research — to save the step where a reader stalls on entering an unfamiliar field.",

    "def.title": "Find the definition that fits a corpus",
    "def.concept": "concept: art",
    "def.back": "← back to the platform",
    "def.lede": "Choose which papers make up your corpus. Every rival definition is re-ranked immediately, and each score opens onto the case table that produced it — including the exact sentence from the paper.",
    "def.point": "<b>The number changes when you change the corpus — that is the whole point.</b> A definition is not right or wrong in itself; it fits, or fails to fit, what a particular literature says. Try removing half the papers and watch the ranking.",

    "corpus.h": "your corpus",
    "corpus.all": "all", "corpus.none": "none", "corpus.invert": "invert",
    "corpus.copy": "copy link", "corpus.copied": "copied ✓",
    "corpus.label": "your corpus:",
    "corpus.papers": "papers", "corpus.judged": "judged cases", "corpus.pos": "positive",

    "dl.h": "download everything",
    "dl.body": "Everything shown here is recomputed in your browser from these files. Download them and check us with your own tools — there is no server and nothing withheld.",

    "jack.btn": "which paper is carrying the result?",
    "jack.few": "At least three papers are needed to test which one is carrying the result.",
    "jack.fragile": "<b>The result is fragile.</b>",
    "jack.stable": "<b>The result is stable.</b> No single paper, removed, changes which definition leads",
    "jack.removing": "Removing",
    "jack.papersChange": "of the papers changes which definition leads.",
    "jack.paperChanges": "of the papers changes which definition leads.",
    "jack.top5": "The five papers whose removal moves the leader's score the most",
    "jack.removes": "knocks it off the top →",
    "jack.keeps": "leaves the leader in place",
    "jack.cases": "cases · score change",

    "gate.ok": "passes", "gate.borderline": "borderline", "gate.disqualified": "disqualified",
    "case.tp": "right", "case.tn": "right",
    "case.fp": "wrongly admits", "case.fn": "wrongly rejects",
    "case.wrongN": "cases this definition gets wrong — with the quote from the paper",
    "case.none": "This definition gets no case wrong on this corpus.",
    "case.paper": "paper", "case.case": "case",

    "calib.missing": "<b>Warning:</b> the circular control cannot be computed on this corpus.",
    "calib.failed": "<b>Warning — calibration failed.</b> The circular control scored",
    "calib.instead": "instead of nearly",
    "calib.why": "It copies the answer, so it <b>must</b> score almost perfectly. If it does not, the coding contradicts itself on this corpus and no other number in the table may be read.",

    "plain.90": "Almost every case falls on the right side.",
    "plain.70": "Agrees with the literature on the large majority of cases.",
    "plain.50": "Agrees with the literature more often than not, and fails on a real minority.",
    "plain.25": "Better than guessing, but wrong on many cases.",
    "plain.02": "Barely distinguishes what the literature admits from what it rejects.",
    "plain.00": "Does not distinguish at all — a coin flip.",
    "plain.neg": "Falls the opposite way from the literature.",
    "plain.none": "Not enough cases in this corpus to compute a score.",

    "unscored.h": "why some papers cannot be selected",
    "unscored.body": "These papers are already tagged — they have cases and quotes — but have not yet been judged against the definitions. <b>And we will not judge them separately</b>: we measured that instruction wording alone moves MCC by about 0.12 for an identical definition, so scores from different runs are not comparable. Splicing in cases judged in another run would produce a table that looks bigger and says less. They open up when the whole corpus is re-scored in one run.",
    "limits.h": "What must not be concluded from this page.",
    "limits.body": "The confidence intervals of the leading definitions overlap — \"among the leaders\" is allowed, \"the best\" is not. The tagging was done in one pass by a single coder, so two-independent-coder reliability is not met and is not claimed. And numbers from one run are not comparable with numbers from another: we measured that instruction wording alone moves MCC by about 0.12 for an identical definition.",
  },
};

let LANG = "he";

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || (I18N.he[key]) || key;
}

function applyLang(code) {
  LANG = I18N[code] ? code : "he";
  const L = I18N[LANG];
  document.documentElement.lang = L.lang;
  document.documentElement.dir = L.dir;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  const sw = document.getElementById("langSwitch");
  if (sw) sw.textContent = L.other;
}

function initLang() {
  const u = new URL(location.href);
  const want = u.searchParams.get("lang") || localStorage.getItem("mtp_lang") || "he";
  applyLang(want);
  const sw = document.getElementById("langSwitch");
  if (sw) {
    sw.onclick = () => {
      const next = I18N[LANG].otherCode;
      applyLang(next);
      localStorage.setItem("mtp_lang", next);
      const u2 = new URL(location.href);
      if (next === "he") u2.searchParams.delete("lang");
      else u2.searchParams.set("lang", next);
      history.replaceState(null, "", u2);
      if (typeof refresh === "function") refresh();
    };
  }
}
