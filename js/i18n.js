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
    "corpus.search.lab": "חיפוש: דיסציפלינה · כותרת · שם מחבר · שנה",
    "corpus.search.ph": "למשל: neuroscience · Danto · 1964 · priming",
    "corpus.hits": "מאמרים",
    "corpus.disc": "דיסציפלינות",
    "corpus.none.found": "אין מאמר שמתאים לחיפוש הזה.",
    "corpus.open": "פתוח",
    "corpus.add": "הוספת מאמר",
    "corpus.add.note": "הוספת מאמר משלכם היא שלב הבא ודורשת שרת — היום אפשר לבקש מאיתנו לתייג אותו, והוא ייכנס לספרייה עם אותה בדיקת ציטוט מילולית כמו כל השאר.",
    "step.go": "כתבו הגדרה — או בחרו מתוך רשימה",
    "step.corpus": "בחרו את הקורפוס",
    "concept.counts": "{p} מאמרים · {c} מקרים מוכרעים · {d} הגדרות",
    "concept.search.lab": "איזה מושג אתם רוצים להגדיר? הקלידו אותו.",
    "concept.search.ph": "אומנות · משחק · deep learning · …",
    "concept.tally": "{r} מושגים מוכנים לניקוד, מתוך {t} שהכלי מכיר. הרשימה נקראת מקובץ נתונים — הוספת מושג היא שינוי בנתונים, לא בממשק.",
    "concept.corpusonly": "{n} מאמרים · לחצו לצפייה בקורפוס · לא ניתן לנקד עדיין",
    "concept.more": "מוצגים 300 - ועוד {n} תואמים. הקלידו לצמצום.",
    "concept.none.h": "אין לנו כלום על “{q}”.",
    "concept.none.body": "זו תשובה אמיתית ולא תקלה: המילה הזו לא מופיעה באף מאמר שאנחנו מחזיקות. כדי לבנות עליה לוח הגדרות צריך קורפוס — מאמרים פתוחים שדנים במושג — ואת המקרים שאפשר לחלץ מהם. אפשר להתחיל מהמאמרים שלכם: בשלב הבא הכלי יאפשר להעלות אותם, ובינתיים כתבו לנו.",
    "concept.soon.body": "<b>יש לנו {n} מאמרים שדנים ב“{term}”, אבל אין לוח הגדרות.</b> ההבדל הוא לא טכני. לוח דורש שני דברים שאין כאן עדיין: <b>מקרים</b> — דברים קונקרטיים שהספרות טוענת עליהם במפורש שהם {term} או שאינם, כל אחד עם הציטוט המדויק — ו<b>הגדרות מתחרות</b> שנשפטות מול כל המקרים <b>בהרצה אחת</b>. אי אפשר להרכיב לוח מניקוד של הרצות נפרדות: ניסוח ההנחיה לבדו מזיז MCC בכ־0.12. זו העבודה, וזה מה שהיא דורשת — לא כפתור שחסר.",
    "concept.note": "שני המושגים אינם בני־השוואה זה לזה במספרים — רק בשיטה. כל הרצה נוקדה בנפרד, וניסוח ההנחיה לבדו מזיז MCC בכ־0.12. מה שכן משותף: אותו כלל, אותה מטריקה, ואותה דרישה שהבקרה תכייל את הטבלה — אבל <b>הבקרה אינה אותה בקרה</b>. באומנות \"מה שקוראים לו אומנות\" היא טאוטולוגיה שמכיילת; במשחק אותו משפט הוא עמדה שנויה במחלוקת שמפסידה לחמש הגדרות מהספרות.",
    "concept.own": "מושג משלכם",
    "concept.own.sub": "בקרוב",
    "cite.ours": "ניסוח שלנו, לא ציטוט:",
    "cite.restrict": "בחנו על {n} מאמרים שדנים בו",
    "abstain.n": "נמנעת מהכרעה ב־{k} מקרים מתוך {n}. זו עמדתה, לא חסר בקידוד — ולכן היא נמדדת רק על מה שענתה, ואינה נבחנת באותן שאלות כמו האחרות.",
    "offer.abstainlead": "<b>קראו את זה לפני שאתם קוראים את הדירוג.</b> ההגדרה שבמקום הראשון — {name} — נמנעת מהכרעה ב־{k} מקרים, ולכן היא לא נשאלה את אותן שאלות כמו האחרות. כשמנקדים את כולן על אותם {n} מקרים בדיוק שהיא כן ענתה עליהם, <b>{beat} הגדרות עוקפות אותה</b> (הראשונה: {who}). הציונים למטה נכונים כפי שהם — כל אחת נמדדת על מה שענתה — אבל הסדר ביניהן אינו השוואה הוגנת.",
    "discrim.body": "<b>אזהרה שנייה, ואחרת מהראשונה.</b> הבקרה שאמורה להיות חסרת תועלת — {ctrl} — קיבלה {mcc} ו<b>עקפה {k} הגדרות מהספרות</b>. הבקרה המעגלית שלמעלה בודקת רק את החשבון ואת האינדוקס; זו בודקת אם <b>הקורפוס עצמו מסוגל להבחין</b>. יחס החיוביים כאן הוא {base} ({pos} חיוביים מול {neg} שליליים), וקורפוס שרובו חיוביים מתגמל הגדרה שמכניסה הכל — וזה בדיוק מה שהבקרה הרחבה עושה. אל תקראו את הדירוג מתחת לצמרת. מה שיתקן את זה אינו עוד מאמרים אלא <b>עוד מקרים שהספרות שוללת</b>.",
    "load.failed": "לא הצלחנו לטעון את נתוני המושג הזה ({dir}). אין כאן שרת, ולכן זה אומר שהקבצים חסרים — לא שמשהו נכשל זמנית.",
    // RETIRED 2026-08-16, kept only so the he/en key counts stay equal. Nothing references it.
    // It rendered step 2 as "all 29 papers", naming the papers that carried verdicts as though
    // they were the corpus - the label Shir asked to have removed. Do not wire it back in: the
    // corpus is what the visitor picked, and the judged count belongs beside the number it
    // affects. Delete it from BOTH tables in one edit or not at all.
    "corpus.allpapers": "כל {n} המאמרים",
    "corpus.nopick": "לא נבחרו מאמרים",
    "board.pick": "בחרו מושג ואז בחרו מאמרים לקורפוס — התוצאות יופיעו כאן.",
    "step.nopick": "טרם נבחר",
    "corpus.npapers": "{n} מאמרים נבחרו",
    "corpus.navail": "{n} מאמרים בקורפוס של המונח",
    "offer.head": "ההגדרות שמתאימות לקורפוס שלכם",
    "offer.sub": "מדורגות לפי מידת ההתאמה",
    "offer.fit": "התאמה",
    "prov.literature": "מתועדת בספרות",
    "prov.user": "הוצעה על ידי",
    "prov.user+tool": "הוצעה על ידי",
    "prov.tool": ", בניסוח שהכלי הציע",
    "prov.control": "בקרה מכוונת",
    "prov.unknown": "מקור לא ידוע",
    "offer.misses": "מקרים שגויים",
    "next.own": "נסו הגדרה משלכם",
    "next.who": "הגדרות לפי חוקר",
    "more.show": "עוד",
    "more.hide": "פחות",
    "own.body": "כתבו הגדרה משלכם למושג. <b>שימו לב לפני שאתם כותבים: אין כאן שרת.</b> מה שתכתבו נשמר בדפדפן שלכם בלבד — הוא לא נשלח לשום מקום, אנחנו לא רואות אותו, ואם תנקו את הדפדפן הוא ייעלם. גם ניקוד אוטומטי עדיין אין, כי ניקוד דורש שיפוט של כל 355 המקרים בהרצה אחת, ותוצאה מהרצה נפרדת אינה בת־השוואה למספרים שבמסך. <b>אם אתם רוצים שההגדרה שלכם תישקל לטבלה — הורידו אותה בכפתור שלמטה ושלחו לנו את הקובץ.</b> זו הדרך היחידה שהיא מגיעה אלינו.",
    "own.name.lab": "שם או כינוי (רשות — אבל רשומה בלי שם לא מקנה קדימוּת)",
    "judge.btn": "נקדו הגדרה משלכם",
    "judge.h": "נקדו את ההגדרה שלכם מול הקורפוס שבחרתם",
    "judge.body": "אין כאן קסם. זו בדיוק העבודה שממנה נוצרה כל עמודה אחרת בלוח: אדם קורא את הדבר ואת המשפט שבו המאמר הכריע לגביו, ואומר כן או לא. אתם תעשו את אותה עבודה עבור ההגדרה שלכם, על הקורפוס שבחרתם, והחשבון שירוץ הוא אותו חשבון בדיוק.<br><br><b>לא תראו את התשובה של הספרות בזמן ההכרעה.</b> מי שרואה את התשובה מודד את מידת ההסכמה שלו עם עצמו. הציון שיצא בר-השוואה להרצה הזאת בלבד.",
    "judge.text.lab": "ההגדרה שאתם מנקדים (כדי שתהיה מול העיניים)",
    "judge.start": "התחלה",
    "judge.reset": "איפוס ההכרעות",
    "own.text.lab": "ההגדרה",
    "own.vis.lab": "מה לעשות עם ההגדרה",
    "own.vis.priv": "פרטית — נשארת בדפדפן שלי, ואף אחד לא רואה אותה",
    "own.vis.pub": "לשיתוף — אשמח שתישקל לטבלה הציבורית",
    "own.send": "שמירה בדפדפן",
    "own.dl": "הורדה כקובץ מתוארך",
    "own.clear": "מחיקת מה ששמור",
    "own.ack": "נשמר בדפדפן הזה בלבד. שום דבר לא נשלח.",
    "own.ack.pub": "נשמר וסומן לשיתוף — אבל סימון לבדו לא שולח כלום. לחצו \"הורדה כקובץ מתוארך\" ושלחו את הקובץ, אחרת הוא נשאר רק אצלכם.",
    "own.empty": "לא נכתבה הגדרה.",
    "own.dl.none": "אין עדיין הגדרה שמורה להורדה.",
    "own.cleared": "נמחק. הדפדפן לא מחזיק יותר דבר.",
    "own.saved.h": "שמור אצלכם",
    "own.saved.corpus": "מול",
    "own.saved.papers": "מאמרים",
    "own.saved.del": "מחיקת הרשומה הזאת",
    "own.saved.delone": "הרשומה נמחקה.",
    "own.rights.h": "זכויות: מה הכלי כן נותן, ומה לא",
    "own.rights.body": "<b>הגדרה שכבר קיימת בספרות אינה שלכם</b>, גם אם הגעתם אליה בעצמכם ואפילו אם ניסחתם אותה טוב יותר. הכלי אינו בודק את זה ואינו יכול — הוא לא מכיר את כל מה שנכתב אי פעם.<br><br><b>מה הוא כן נותן: חותמת זמן.</b> ההגדרה שכתבתם נרשמת כאן עם השם או הכינוי שבחרתם, עם התאריך והשעה, ועם הקורפוס שמולו נוקדה. זה כל מה שיש, וזה לא מעט: מה שמקנה בעלות באקדמיה אינו זכויות יוצרים אלא <b>קדימוּת</b> — רשומה ציבורית, מתוארכת, נושאת שם. הגדרה של משפט אחד קצרה ופונקציונלית מכדי שזכויות יוצרים יחולו עליה בכלל.<br><br><b>מה לעשות אם ההגדרה חשובה לכם.</b> אל תסתפקו בקובץ שירד למחשב שלכם — הוא מוכיח רק שהיה לכם קובץ. הפקידו אותה במקום שמנפיק <span class=\"ltr\">DOI</span> (זנודו, OSF, arXiv). זו רשומה שצד שלישי מתארך ולא אתם, ולכן היא זו שנחשבת.",
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
    "cite.h": "ציטוט",
    "cite.body": "ההגדרה והמדידה מופקדות כרשומה מתוארכת: <span class=\"ltr\">Sivroni, S. (2026). A values-illustration definition of art, scored against a verbatim-grounded corpus. Zenodo.</span> <span class=\"ltr\">https://doi.org/10.5281/zenodo.21891054</span> — ה־DOI הזה מצביע תמיד על הגרסה האחרונה. הפקדה מתוארכת היא מה שמבסס קדימוּת; ההגדרה עצמה קצרה מכדי שזכויות יוצרים יחולו עליה.",
    "a11y.why": "הסבר",
    "a11y.close": "סגירה",
    "a11y.open": "פתיחה",
    "crit.btn": "בנו הגדרה מתנאים",
    "crit.h": "בניית הגדרה מתנאים",
    "crit.body": "אלה <b>14 תנאים מועמדים</b> שנאספו מהספרות על הגדרת אומנות. הם <b>הצעה, לא כפייה</b>: השאירו את מה שאתם מקבלים, הורידו את מה שלא, והוסיפו תנאי משלכם. ליד כל תנאי כתוב <b>את מי הוא מוציא</b> — זה החלק שצריך כדי להחליט אם אתם מסכימים איתו. הכלי ינסח מההגדרה שבניתם טקסט, ו<b>לא ינקד אותו</b>: ניקוד מחייב שיפוט של כל המקרים באותה הרצה כמו שאר ההגדרות, וציון מהרצה נפרדת אינו בר־השוואה למספרים שבמסך.",
    "crit.excl": "מוציא:",
    "crit.all": "סמנו הכל",
    "crit.none": "נקו הכל",
    "crit.add.lab": "תנאי משלכם",
    "crit.add": "הוספת תנאי",
    "crit.out.h": "ההגדרה שבניתם",
    "crit.out.none": "לא נבחר אף תנאי. הגדרה בלי תנאים מקבלת כל דבר.",
    "crit.out.pre": "דבר הוא אומנות אם ורק אם מתקיימים בו כל אלה:",
    "crit.use": "העברה אל \"נסו הגדרה משלכם\"",
    "crit.used": "ההגדרה הועברה. פתחו את \"נסו הגדרה משלכם\" כדי לשמור או להוריד אותה.",
    "btn.rights": "זכויות ובעלות",
    "btn.rights.lead": "של מי ההגדרה, של מי המאמרים, ומה קורה אם מישהו יפרסם אותה מחר",
    "btn.rights.why": "שאלה שנשאלה, ולכן היא כאן ולא בעמוד נפרד: אם הגדרה נחשפת בכלי הזה ובעוד חודש מופיעה במאמר של מישהו אחר — של מי היא.",
    "rights.body": "<b>שכבת התיוג.</b> המקרים, הציטוטים, ההכרעות והציונים הם שלנו, ומשוחררים תחת <span class=\"ltr\">CC BY 4.0</span> — מותר לקחת, לשנות ולפרסם, בתנאי שמצטטים.<br><br><b>טקסט המאמרים.</b> שייך למחברים ולמו\"לים. אנחנו <b>מקשרות ולא משכפלות</b>, והציטוטים המוצגים קצרים ומשמשים לזיהוי ולאימות בלבד. לקורפוס נכנסים רק מאמרים פתוחים.<br><br><b>ההגדרות בטבלה.</b> אלו שמקורן בספרות שייכות למי שניסח אותן ומיוחסות אליו. אלו שהוצעו על ידי אדם נושאות את שמו ואת תאריך ההצעה בשדות <span class=\"ltr\">proposed_by</span> ו־<span class=\"ltr\">proposed_on</span> — לא \"משתמש אנונימי\", כי רשומה אנונימית אינה מבססת דבר.<br><br><b>ואם מישהו יפרסם את ההגדרה מחר?</b> התשובה הישרה: הגדרה של משפט אחד היא בדרך כלל קצרה ופונקציונלית מכדי שזכות יוצרים תחול עליה, ולכן אי אפשר למנוע שימוש. מה שכן קיים הוא <b>קדימוּת</b>. אם קיימת רשומה מתוארכת עם שמכם שקדמה לפרסום — ההגדרה מיוחסת לכם ומי שלא מצטט מבצע פלגיאט, שזו עבירה אקדמית כבדה וקלה להוכחה. אם אין רשומה כזו — מעשית אין במה להיאחז. לכן: אם ההגדרה חשובה לכם, הפקידו אותה במקום שנותן תאריך רשום ומזהה קבוע לפני שאתם חושפים אותה.<br><br><b>מה שאתם כותבים כאן.</b> נשאר בדפדפן שלכם. אין שרת שיכול לקבל אותו, ולכן גם אין דרך שנפרסם אותו בלי שתשלחו לנו את הקובץ בעצמכם.",
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

    "unscored.h": "אפשר לבחור כל מאמר — לא כל מאמר משנה את הציון",
    "unscored.body": "כל 598 המאמרים פתוחים לבחירה: הקורפוס הוא מה שבחרתם. אבל רק מאמר שנושא הכרעות יכול לשנות מספר, ולכן ליד כל בחירה כתוב כמה מהמאמרים שבחרתם נושאים הכרעות וכמה לא. מאמר שטרם נוקד תויג כבר — יש לו מקרים וציטוטים — אבל <b>לא ננקד אותו בנפרד</b>: מדדנו שניסוח ההוראה לשופטים מזיז את ה־MCC בכ־0.12 לאותה הגדרה בדיוק, ולכן ציונים מהרצות שונות אינם ברי־השוואה. הכרעות ייפתחו כשכל הקורפוס ינוקד מחדש בהרצה אחת.",
    "corpus.split": "<span class=\"num\">{n}</span> מאמרים נבחרו · <span class=\"num\">{k}</span> נושאים הכרעות ומנוקדים · <span class=\"num\">{m}</span> ללא הכרעה, ואינם משנים אף מספר",
    "corpus.split.none": "אף אחד מהמאמרים שבחרתם אינו נושא הכרעות, ולכן אין ממה לחשב ציון.",
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
    "corpus.search.lab": "Search: discipline · title · author · year",
    "corpus.search.ph": "e.g. neuroscience · Danto · 1964 · priming",
    "corpus.hits": "papers",
    "corpus.disc": "disciplines",
    "corpus.none.found": "No paper matches that search.",
    "corpus.open": "open",
    "corpus.add": "Add a paper",
    "corpus.add.note": "Adding your own paper is the next stage and needs a server. Today you can ask us to tag it, and it enters the library under the same verbatim check as everything else.",
    "step.go": "Write a definition — or pick one from a list",
    "step.corpus": "Choose the corpus",
    "concept.counts": "{p} papers · {c} adjudicated cases · {d} definitions",
    "concept.search.lab": "Which concept do you want to define? Type it.",
    "concept.search.ph": "art · game · deep learning · …",
    "concept.tally": "{r} concepts ready to score, out of {t} the tool knows about. The list is read from a data file — adding a concept is a data change, not an interface change.",
    "concept.corpusonly": "{n} papers · click to see the corpus · not scoreable yet",
    "concept.more": "showing 300 of these — {n} more match. Type to narrow the search.",
    "concept.none.h": "We hold nothing on “{q}”.",
    "concept.none.body": "That is a real answer, not a failure: the word appears in none of the papers we hold. Building a board for it needs a corpus — open-access papers that argue about the concept — and the cases that can be drawn from them. Your own papers are a fine place to start: uploading them is the next component, and until then, write to us.",
    "concept.soon.body": "<b>We hold {n} papers that discuss “{term}”, but there is no definition board.</b> The gap is not technical. A board needs two things that do not exist here yet: <b>cases</b> — concrete things the literature explicitly asserts are or are not {term}, each with the exact sentence — and <b>rival definitions</b> judged against every case <b>in one run</b>. A board cannot be assembled from separate runs: instruction wording alone moves MCC by about 0.12. That is the work, and that is what it takes — not a missing button.",
    "concept.note": "The two concepts are not comparable to each other in their numbers — only in their method. Each was scored in its own run, and instruction wording alone moves MCC by about 0.12. What they share: one rule, one metric, and the requirement that a control calibrate the table — but <b>it is not the same control</b>. For art, \"whatever people call art\" is a tautology that calibrates everything else; for game the same sentence is a contested position that loses to five published definitions.",
    "concept.own": "your own concept",
    "concept.own.sub": "coming",
    "cite.ours": "our wording, not a quotation:",
    "cite.restrict": "test it on the {n} papers that discuss them",
    "abstain.n": "declines to decide {k} of {n} cases. That is its position, not a gap in the coding — so it is graded only on what it answered, and is not being asked the same questions as the rest.",
    "offer.abstainlead": "<b>Read this before you read the ranking.</b> The definition in first place — {name} — declines to decide {k} cases, so it was not asked the same questions as the others. Score every definition on exactly the {n} cases it did answer and <b>{beat} of them beat it</b> (first: {who}). The scores below are correct as they stand — each is measured on what it answered — but the order between them is not a fair comparison.",
    "discrim.body": "<b>A second warning, and a different one.</b> The control that is meant to be useless — {ctrl} — scored {mcc} and <b>beat {k} published definition(s)</b>. The circular control above tests only the arithmetic and the case indexing; this one tests whether <b>the corpus itself can discriminate</b>. The base rate here is {base} ({pos} positive against {neg} negative), and a corpus that is mostly positives rewards a definition that admits everything — which is exactly what the broad control does. Do not read the ranking below the top few. The cure is not more papers; it is <b>more cases the literature denies</b>.",
    "load.failed": "could not load this concept's data ({dir}). There is no server, so this means the files are missing rather than temporarily unavailable.",
    // RETIRED 2026-08-16 - see the note beside the Hebrew twin of this key. Referenced nowhere.
    "corpus.allpapers": "all {n} papers",
    "corpus.nopick": "no papers chosen",
    "board.pick": "Choose a concept, then choose papers for the corpus — results appear here.",
    "step.nopick": "not chosen yet",
    "corpus.npapers": "{n} papers selected",
    "corpus.navail": "{n} papers in this term's corpus",
    "offer.head": "The definitions that fit your corpus",
    "offer.sub": "ranked by how well they fit",
    "offer.fit": "fit",
    "prov.literature": "attested in the literature",
    "prov.user": "proposed by",
    "prov.user+tool": "proposed by",
    "prov.tool": ", reworded by the tool",
    "prov.control": "deliberate control",
    "prov.unknown": "provenance unknown",
    "offer.misses": "cases wrong",
    "next.own": "Try your own definition",
    "next.who": "Definitions by scholar",
    "more.show": "more",
    "more.hide": "less",
    "own.body": "Write your own definition of the concept. <b>Before you do, know this: there is no server.</b> What you write is saved in your browser only — it is not sent anywhere, we never see it, and clearing your browser deletes it. Nor is it scored automatically, because scoring means judging all 355 cases in one run, and a result from a separate run is not comparable with the numbers on this screen. <b>If you want your definition considered for the table, download it with the button below and send us the file.</b> That is the only way it reaches us.",
    "own.name.lab": "Name or nickname (optional — but a record with no name confers no priority)",
    "judge.btn": "score your own definition",
    "judge.h": "Score your definition against the corpus you chose",
    "judge.body": "There is no magic here. This is exactly the work every other column on the board was made by: a person reads the thing, and the sentence in which a paper decided it, and says yes or no. You do that same work for your definition, over the corpus you chose, and the arithmetic that runs is the same arithmetic.<br><br><b>You are not shown the literature's answer while you judge.</b> A scorer who can see the answer is measuring their own agreeableness. The score is comparable within this run and nothing else.",
    "judge.text.lab": "The definition you are scoring (kept in front of you)",
    "judge.start": "start",
    "judge.reset": "clear my verdicts",
    "own.text.lab": "The definition",
    "own.vis.lab": "What to do with it",
    "own.vis.priv": "Private — stays in my browser, nobody sees it",
    "own.vis.pub": "For sharing — I would like it considered for the public table",
    "own.send": "save in this browser",
    "own.dl": "download as a dated file",
    "own.clear": "delete what is saved",
    "own.ack": "Saved in this browser only. Nothing was sent.",
    "own.ack.pub": "Saved and marked for sharing — but marking alone sends nothing. Press \"download as a dated file\" and send us the file, or it stays with you.",
    "own.empty": "No definition was written.",
    "own.dl.none": "Nothing saved to download yet.",
    "own.cleared": "Deleted. The browser holds nothing further.",
    "own.saved.h": "Saved on your machine",
    "own.saved.corpus": "against",
    "own.saved.papers": "papers",
    "own.saved.del": "delete this record",
    "own.saved.delone": "That record is gone.",
    "own.rights.h": "Rights: what the tool does give you, and what it does not",
    "own.rights.body": "<b>A definition that already exists in the literature is not yours</b>, even if you arrived at it independently and even if you worded it better. The tool cannot check this and does not pretend to &mdash; it does not know everything ever written.<br><br><b>What it does give you: a timestamp.</b> The definition you write is recorded here with the name or nickname you choose, the date and time, and the corpus it was scored against. That is all it is, and it is not nothing: what confers ownership in academia is not copyright but <b>priority</b> &mdash; a dated public record carrying a name. A one-sentence definition is far too short and too functional for copyright to attach in the first place.<br><br><b>If the definition matters to you.</b> Do not rely on the file that downloaded to your machine; it proves only that you had a file. Deposit it somewhere that issues a <span class=\"ltr\">DOI</span> &mdash; Zenodo, OSF, arXiv. That is a record a third party dates, not you, which is why it is the one that counts.",
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
    "cite.h": "Citation",
    "cite.body": "The definition and its measurement are deposited as a dated record: <span class=\"ltr\">Sivroni, S. (2026). A values-illustration definition of art, scored against a verbatim-grounded corpus. Zenodo.</span> <span class=\"ltr\">https://doi.org/10.5281/zenodo.21891054</span> — that DOI always resolves to the latest version. A dated deposit is what establishes priority; the definition itself is too short for copyright to attach.",
    "a11y.why": "why",
    "a11y.close": "close",
    "a11y.open": "open",
    "crit.btn": "Build a definition from criteria",
    "crit.h": "Build a definition from criteria",
    "crit.body": "These are <b>14 candidate criteria</b> collected from the literature on defining art. They are <b>an offer, not a requirement</b>: keep the ones you accept, drop the ones you do not, add your own. Beside each one is <b>what it excludes</b> — that is the part you need in order to decide whether you agree with it. The tool will word the definition you build, and will <b>not score it</b>: scoring means judging every case in the same run as the other definitions, and a score from a separate run is not comparable with the numbers on this screen.",
    "crit.excl": "excludes:",
    "crit.all": "select all",
    "crit.none": "clear all",
    "crit.add.lab": "A criterion of your own",
    "crit.add": "add criterion",
    "crit.out.h": "The definition you built",
    "crit.out.none": "No criterion selected. A definition with no conditions admits everything.",
    "crit.out.pre": "A thing is art if and only if all of the following hold:",
    "crit.use": "send to \"try your own definition\"",
    "crit.used": "Sent. Open \"try your own definition\" to save or download it.",
    "btn.rights": "Rights and ownership",
    "btn.rights.lead": "whose definition, whose papers, and what happens if someone publishes it tomorrow",
    "btn.rights.why": "A question we were actually asked, which is why it lives here and not on a separate page: if a definition is exposed in this tool and appears in someone else's paper a month later, whose is it.",
    "rights.body": "<b>The tag layer.</b> The cases, quotes, adjudications and scores are ours, released under <span class=\"ltr\">CC BY 4.0</span> — take it, change it, publish it, as long as you cite.<br><br><b>Paper text.</b> Belongs to its authors and publishers. We <b>link and do not reproduce</b>, and the quotes shown are short and serve identification and verification only. Only open-access papers enter the corpus.<br><br><b>The definitions in the table.</b> Those drawn from the literature belong to whoever formulated them and are attributed. Those a person proposed carry that person's name and the date they proposed it, in <span class=\"ltr\">proposed_by</span> and <span class=\"ltr\">proposed_on</span> — not \"anonymous user\", because an anonymous record establishes nothing.<br><br><b>And if someone publishes the definition tomorrow?</b> The honest answer: a one-sentence definition is usually too short and too functional for copyright to attach, so use cannot be prevented. What does exist is <b>priority</b>. If a dated record bearing your name predates their publication, the definition is attributed to you and failing to cite it is plagiarism — a serious academic offence and an easy one to prove. If no such record exists, there is practically nothing to hold on to. So: if the definition matters to you, deposit it somewhere that registers a date and a persistent identifier before you expose it.<br><br><b>What you write here.</b> Stays in your browser. There is no server that can receive it, so there is also no way for us to publish it unless you send us the file yourself.",
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

    "unscored.h": "any paper can be chosen — not every paper moves the score",
    "unscored.body": "All 598 papers are selectable: the corpus is what you pick. But only a paper carrying verdicts can move a number, so every selection says how many of your papers carry them and how many do not. A paper not yet judged is already tagged — it has cases and quotes — but <b>we will not judge it separately</b>: we measured that instruction wording alone moves MCC by about 0.12 for an identical definition, so scores from different runs are not comparable. Verdicts open up when the whole corpus is re-scored in one run.",
    "corpus.split": "<span class=\"num\">{n}</span> papers chosen · <span class=\"num\">{k}</span> carry verdicts and are scored · <span class=\"num\">{m}</span> have no verdict and change no number",
    "corpus.split.none": "None of the papers you chose carries a verdict, so there is nothing to compute a score from.",
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
  // A placeholder is visible text and has to switch language with everything else. Setting
  // it through innerHTML would have written the string into the input's markup instead.
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.setAttribute("placeholder", t(el.dataset.i18nPh));
  });
  const sw = document.getElementById("langSwitch");
  if (sw) sw.textContent = L.other;
}

function initLang() {
  const u = new URL(location.href);
  // A page may declare its own language (define/index-en.html does). That wins over
  // everything: the query string is lost when Windows opens a local file by
  // double-click, and the stored preference then silently overrode the URL.
  const want = window.MTP_FORCE_LANG || u.searchParams.get("lang")
    || localStorage.getItem("mtp_lang") || "en";   // English is the default now
  applyLang(want);
  const sw = document.getElementById("langSwitch");
  if (sw) {
    sw.onclick = () => {
      const next = I18N[LANG].otherCode;
      applyLang(next);
      localStorage.setItem("mtp_lang", next);
      const u2 = new URL(location.href);
      // English is the default, so IT is the clean URL and Hebrew carries the parameter.
      if (next === "en") u2.searchParams.delete("lang");
      else u2.searchParams.set("lang", next);
      history.replaceState(null, "", u2);
      if (typeof refresh === "function") refresh();
    };
  }
}
