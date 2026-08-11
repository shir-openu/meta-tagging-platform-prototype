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

    "def.title": "מציאת הגדרה לפי קורפוס",
    "step.concept": "בחרו מושג להגדיר",
    "step.corpus": "בחרו את הקורפוס",
    "concept.art": "אומנות",
    "concept.art.sub": "המושג היחיד שנטען כרגע",
    "concept.own": "מושג משלכם",
    "concept.own.sub": "בקרוב",
    "corpus.allpapers": "כל {n} המאמרים",
    "corpus.npapers": "{n} מאמרים נבחרו",
    "offer.head": "ההגדרות שמתאימות לקורפוס שלכם",
    "offer.sub": "מדורגות לפי מידת ההתאמה",
    "offer.fit": "התאמה",
    "offer.misses": "מקרים שגויים",
    "next.own": "נסו הגדרה משלכם",
    "next.who": "הגדרות לפי חוקר",
    "more.show": "עוד",
    "more.hide": "פחות",
    "own.body": "כתבו הגדרה משלכם למושג. <b>בשלב הזה איננו מנקדות אותה אוטומטית</b>, כי ניקוד דורש שיפוט של כל 355 המקרים, ותוצאה מהרצה נפרדת אינה בת־השוואה למספרים שבמסך. ההגדרה שתכתבו נשמרת ותנוקד בהרצה הבאה — ובינתיים מעניין אותנו מאוד לראות מה אנשים מציעים.",
    "own.send": "שמירת ההגדרה",
    "own.ack": "נשמר. תודה — זה בדיוק סוג הנתון שאנחנו מחפשות.",
    "own.empty": "לא נכתבה הגדרה.",
    "who.body": "בחרו חוקר, והקורפוס יצטמצם למאמרים שמתדיינים איתו. זו הדרך לשאול \"איך המושג נראה בעיני מי שקורא את דנטו\" — ולראות שהתשובה משתנה.",
    "who.none": "אין די תיאורטיקנים מתויגים בקורפוס הזה.",
    "faq.btn": "שאלות נפוצות",
    "faq.body": "<b>למה המספר משתנה כשאני משנה את הקורפוס?</b><br>זו כל הנקודה. הגדרה אינה נכונה או שגויה בפני עצמה — היא מתאימה או לא מתאימה למה שספרות מסוימת אומרת. נסו להוריד חצי מהמאמרים ולראות מה קורה לדירוג.<br><br><b>למה יש בטבלה הגדרה מטופשת בכוונה?</b><br>\"מה שקוראים לו אומנות\" היא מעגלית וחסרת ערך, והיא שם כדי לבדוק אותנו: היא מעתיקה את התשובה ולכן חייבת לקבל כמעט 1.000+. אם לא — הקידוד שלנו סותר את עצמו והמסך יזהיר.<br><br><b>למה יש מאמרים שאי אפשר לבחור?</b><br>הם תויגו אך טרם נוקדו. לא ננקד אותם בנפרד, כי ציונים מהרצות שונות אינם ברי־השוואה; הם ייפתחו כשכל הקורפוס ינוקד מחדש בהרצה אחת.<br><br><b>אפשר לסמוך על הדירוג?</b><br>על הצמרת — לא לגמרי. רווחי הסמך של ההגדרות המובילות חופפים, ולכן מותר לומר \"בין המובילות\" ואסור לומר \"הראשונה\". התיוג נעשה בידי מקודדת אחת, ואיננו טוענות למהימנות בין שני מקודדים.<br><br><b>מאיפה המספרים?</b><br>הכל מחושב בדפדפן משני קבצים שאפשר להוריד. אין שרת, ואין מספר שאי אפשר לשחזר.",
    "btn.open": "פתיחה",
    "btn.corpus": "בחירת המאמרים",
    "btn.corpus.lead": "אילו מאמרים מרכיבים את הקורפוס שלך",
    "btn.corpus.why": "הקורפוס הוא רשימת המאמרים שמולה נמדדות ההגדרות. אתם בוחרים אותה, ולא אנחנו — כי היא זו שקובעת את התוצאה. סמנו וראו את התשובה למעלה משתנה.",
    "btn.board": "כל ההגדרות",
    "btn.board.lead": "הדירוג המלא, וכל מקרה שכל הגדרה טועה בו",
    "btn.board.why": "שלוש־עשרה הגדרות של אומנות, מדורגות לפי מידת ההתאמה לקורפוס שבחרתם. מתחת לכל אחת אפשר לפתוח את רשימת המקרים שהיא טועה בהם, ולכל מקרה מוצג המשפט המדויק מהמאמר.",
    "btn.jack": "מי מחזיק את התוצאה",
    "btn.jack.lead": "האם מאמר אחד קובע את כל התשובה",
    "btn.jack.why": "מסירים כל מאמר בתורו ובודקים אם התשובה משתנה. תוצאה שנשענת על מאמר בודד אינה תוצאה, וזו הבדיקה שאומרת לכם אם זה המצב.",
    "btn.how": "איך נמדד הציון",
    "btn.how.lead": "מה המספר אומר, ומה אסור להסיק ממנו",
    "btn.how.why": "הסבר קצר על המדד, על ההגדרה המעגלית שנמצאת בטבלה בכוונה כדי לבדוק אותנו, ועל מה שהכלי לא יודע.",
    "btn.dl": "הורדת הנתונים",
    "btn.dl.lead": "כל מה שהמסך הזה מחשב, לבדיקה בכלים שלך",
    "btn.dl.why": "אין כאן שרת. כל מספר מחושב בדפדפן מהקבצים האלה, ואפשר להוריד אותם ולהגיע לאותן תוצאות בכלים משלכם.",
    "btn.share": "שיתוף הקורפוס",
    "btn.share.lead": "קישור שמשחזר בדיוק את מה שאתם רואים",
    "btn.share.why": "בחירת הקורפוס נשמרת בכתובת. אפשר להעתיק את הקישור למאמר או למייל, וכל מי שייכנס יראה בדיוק את אותו קורפוס ואת אותם מספרים.",
    "btn.copy": "העתקת קישור",
    "hero.lead": "ההגדרה שמתאימה הכי טוב לקורפוס שלך",
    "hero.empty": "לא נבחרו מאמרים. פתחו את \"בחירת המאמרים\" וסמנו לפחות אחד.",
    "hero.of": "מתוך",
    "hero.defs": "הגדרות",
    "how.body": "<b>MCC</b> הוא מדד התאמה שנע בין 1.000- ל־1.000+. ‎+1.000 היא התאמה מושלמת לספרות, 0.000 כמו הטלת מטבע, ושלילי נופל בכיוון ההפוך. בחרנו בו ולא ב־F1 מפני שכ־80% מהמקרים כאן חיוביים, ו־F1 מתגמל הגדרה שמקבלת כמעט הכל.<br><br><b>יש בטבלה הגדרה מטופשת בכוונה</b> — \"מה שקוראים לו אומנות\". היא מעגלית וחסרת ערך, והיא שם כדי לבדוק אותנו: היא מעתיקה את התשובה, ולכן חייבת לקבל כמעט 1.000+. אם לא — הקידוד שלנו סותר את עצמו והמסך יזהיר אתכם שאין לקרוא אף מספר.",
    "how.more": "העמוד המלא על השיטה",
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
    "step.concept": "Choose a concept to define",
    "step.corpus": "Choose the corpus",
    "concept.art": "art",
    "concept.art.sub": "the only concept currently loaded",
    "concept.own": "your own concept",
    "concept.own.sub": "coming",
    "corpus.allpapers": "all {n} papers",
    "corpus.npapers": "{n} papers selected",
    "offer.head": "The definitions that fit your corpus",
    "offer.sub": "ranked by how well they fit",
    "offer.fit": "fit",
    "offer.misses": "cases wrong",
    "next.own": "Try your own definition",
    "next.who": "Definitions by scholar",
    "more.show": "more",
    "more.hide": "less",
    "own.body": "Write your own definition of the concept. <b>We do not score it automatically yet</b>, because scoring means judging all 355 cases, and a result from a separate run is not comparable with the numbers on this screen. What you write is saved and scored in the next run — and in the meantime we are very interested in what people propose.",
    "own.send": "save the definition",
    "own.ack": "Saved. Thank you — this is exactly the kind of data we are after.",
    "own.empty": "No definition was written.",
    "who.body": "Pick a scholar and the corpus narrows to the papers that engage with them. This is how you ask \"what does the concept look like to someone who reads Danto\" — and watch the answer change.",
    "who.none": "Not enough tagged theorists in this corpus.",
    "faq.btn": "Common questions",
    "faq.body": "<b>Why does the number change when I change the corpus?</b><br>That is the whole point. A definition is not right or wrong in itself — it fits, or fails to fit, what a particular literature says. Try removing half the papers and watch the ranking.<br><br><b>Why is there a deliberately silly definition in the table?</b><br>\"Whatever people call art\" is circular and worthless, and it is there to check us: it copies the answer, so it must score near +1.000. If it does not, our coding contradicts itself and the screen says so.<br><br><b>Why can some papers not be selected?</b><br>They are tagged but not yet scored. We will not score them separately, because numbers from different runs are not comparable; they open up when the whole corpus is re-scored in one run.<br><br><b>Can I trust the ranking?</b><br>At the top, not entirely. The confidence intervals of the leading definitions overlap, so \"among the leaders\" is allowed and \"the best\" is not. A single coder did the tagging, and we claim no two-coder reliability.<br><br><b>Where do the numbers come from?</b><br>Everything is computed in your browser from two downloadable files. There is no server, and no number that cannot be reproduced.",
    "btn.open": "open",
    "btn.corpus": "Choose the papers",
    "btn.corpus.lead": "which papers make up your corpus",
    "btn.corpus.why": "The corpus is the list of papers the definitions are measured against. You choose it, not us, because it is what decides the answer. Tick papers and watch the answer above change.",
    "btn.board": "All the definitions",
    "btn.board.lead": "the full ranking, and every case each definition gets wrong",
    "btn.board.why": "Thirteen definitions of art, ranked by how well they fit the corpus you chose. Under each one you can open the list of cases it gets wrong, and every case shows the exact sentence from the paper.",
    "btn.jack": "Which paper is carrying the result",
    "btn.jack.lead": "does one paper decide the whole answer",
    "btn.jack.why": "Remove each paper in turn and see whether the answer changes. A result that rests on a single paper is not a result, and this is the check that tells you whether that is the case.",
    "btn.how": "How the score is measured",
    "btn.how.lead": "what the number means, and what must not be concluded from it",
    "btn.how.why": "A short explanation of the metric, of the circular definition that sits in the table on purpose to check us, and of what the tool does not know.",
    "btn.dl": "Download the data",
    "btn.dl.lead": "everything this screen computes, to check with your own tools",
    "btn.dl.why": "There is no server. Every number is computed in your browser from these files, and you can download them and reach the same results with your own tools.",
    "btn.share": "Share the corpus",
    "btn.share.lead": "a link that reproduces exactly what you are seeing",
    "btn.share.why": "The corpus selection is stored in the address. Copy the link into a paper or an email and whoever opens it sees the same corpus and the same numbers.",
    "btn.copy": "copy link",
    "hero.lead": "the definition that best fits your corpus",
    "hero.empty": "No papers selected. Open \"Choose the papers\" and tick at least one.",
    "hero.of": "of",
    "hero.defs": "definitions",
    "how.body": "<b>MCC</b> is a fit measure running from -1.000 to +1.000. +1.000 is a perfect match with the literature, 0.000 is a coin flip, negative falls the opposite way. We use it rather than F1 because about 80% of the cases here are positive, and F1 rewards a definition that admits almost everything.<br><br><b>There is a deliberately silly definition in the table</b> — \"whatever people call art\". It is circular and worthless, and it is there to check us: it copies the answer, so it must score near +1.000. If it does not, our coding contradicts itself and the screen warns you that no number may be read.",
    "how.more": "the full page on the method",
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
