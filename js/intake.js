(() => {
  "use strict";

  function evaluate(values) {
    if (!values.locator || !values.source || !values.rights || !values.fulltext ||
        !values.quality || !values.language || !values.scope) {
      return { state: "incomplete" };
    }
    if (values.source === "pdf") return { state: "refused", reason: "PDF_ONLY" };
    if (values.rights !== "cleared") return { state: "refused", reason: "RIGHTS_NOT_CLEARED" };
    if (values.fulltext !== "yes") return { state: "refused", reason: "NO_FULL_TEXT" };
    if (values.quality === "scan") return { state: "refused", reason: "IMAGE_ONLY" };
    if (values.language !== "english") return { state: "refused", reason: "UNSUPPORTED_LANGUAGE" };
    if (values.scope !== "paper") return { state: "refused", reason: "OUT_OF_SCOPE" };
    return { state: "accepted" };
  }

  window.__INTAKE_EVALUATE__ = evaluate;

  const form = document.getElementById("intakePreflight");
  const result = document.getElementById("preflightResult");
  const email = document.getElementById("eligibleEmail");
  if (!form || !result || !email) return;

  const lang = document.documentElement.lang === "he" ? "he" : "en";
  const copy = {
    en: {
      incompleteTitle: "Complete the source check",
      incomplete: "Choose one answer in every section and name the DOI, source URL or paper title. No payment has been taken or held.",
      refusedTitle: "We cannot accept this source",
      acceptedTitle: "This request can go to manual review",
      accepted: "The answers pass this first screen. This is not final acceptance: Shir will verify the paper and reply before any $2 authorization hold. No payment has been taken or held.",
      email: "Email this request",
      reasons: {
        PDF_ONLY: "The current safe workflow cannot use PDF text. No payment was requested. Send a DOI, repository URL or lawful MHTML source and we will recheck it.",
        RIGHTS_NOT_CLEARED: "We cannot use or publish this full text under the current service policy. No payment was requested. This is a rights decision, not a judgement about the paper.",
        NO_FULL_TEXT: "We found only a citation or abstract, not the complete paper needed for verbatim tagging. No payment was requested.",
        IMAGE_ONLY: "This copy is a scan without reliable selectable text, so we cannot preserve exact source sentences. No payment was requested.",
        UNSUPPORTED_LANGUAGE: "The first release supports English full text only. No payment was requested.",
        OUT_OF_SCOPE: "This item is not an academic paper the current tag schema can handle. No payment was requested."
      }
    },
    he: {
      incompleteTitle: "השלימו את בדיקת המקור",
      incomplete: "בחרו תשובה אחת בכל חלק וציינו DOI, קישור למקור או כותרת מאמר. לא בוצע חיוב ולא נתפסה מסגרת אשראי.",
      refusedTitle: "אי אפשר לקבל את המקור הזה",
      acceptedTitle: "אפשר להעביר את הבקשה לבדיקה ידנית",
      accepted: "התשובות עוברות את המסך הראשון. זו עדיין לא קבלה סופית: שיר תאמת את המאמר ותשיב לפני אישור זמני כלשהו של שני דולר. לא בוצע חיוב ולא נתפסה מסגרת אשראי.",
      email: "שליחת הבקשה בדוא״ל",
      reasons: {
        PDF_ONLY: "תהליך העבודה הבטוח הנוכחי אינו יכול להשתמש בטקסט מתוך PDF. לא התבקש תשלום. שלחו DOI, קישור למאגר או מקור MHTML חוקי ונבדוק שוב.",
        RIGHTS_NOT_CLEARED: "מדיניות השירות הנוכחית אינה מאפשרת לנו להשתמש בטקסט המלא הזה או לפרסם אותו. לא התבקש תשלום. זו החלטת זכויות, לא שיפוט של המאמר.",
        NO_FULL_TEXT: "נמצאו רק רשומה ביבליוגרפית או תקציר, ולא המאמר המלא הדרוש לתיוג מילולי. לא התבקש תשלום.",
        IMAGE_ONLY: "העותק הוא סריקה ללא טקסט אמין ובר־בחירה, ולכן אי אפשר לשמר את משפטי המקור המדויקים. לא התבקש תשלום.",
        UNSUPPORTED_LANGUAGE: "הגרסה הראשונה תומכת רק בטקסט מלא באנגלית. לא התבקש תשלום.",
        OUT_OF_SCOPE: "הפריט אינו מאמר אקדמי שסכמת התיוג הנוכחית יכולה לטפל בו. לא התבקש תשלום."
      }
    }
  }[lang];

  const selected = name => form.querySelector(`input[name="${name}"]:checked`)?.value || "";

  function values() {
    return {
      locator: form.elements.locator.value.trim(),
      source: selected("source"),
      rights: selected("rights"),
      fulltext: selected("fulltext"),
      quality: selected("quality"),
      language: selected("language"),
      scope: selected("scope"),
      filename: form.elements.mhtml?.files?.[0]?.name || ""
    };
  }

  function setResult(decision, input) {
    result.hidden = false;
    result.dataset.state = decision.state;
    email.hidden = true;
    email.removeAttribute("href");
    if (decision.state === "incomplete") {
      result.innerHTML = `<b>${copy.incompleteTitle}</b><p>${copy.incomplete}</p>`;
      result.focus();
      return;
    }
    if (decision.state === "refused") {
      result.innerHTML = `<b>${copy.refusedTitle}</b><p>${copy.reasons[decision.reason]}</p>` +
        `<span class="reason-code">${decision.reason}</span>`;
      result.focus();
      return;
    }

    result.innerHTML = `<b>${copy.acceptedTitle}</b><p>${copy.accepted}</p>`;
    const subject = lang === "he" ? "בקשת מטא־תיוג — מקור לבדיקה" : "Meta-tagging request — source check";
    const lines = lang === "he"
      ? ["DOI / קישור / כותרת:", input.locator, "", "סוג מקור:", input.source,
         "", "שם קובץ MHTML (אם יש):", input.filename || "—", "", "הערות:"]
      : ["DOI / URL / title:", input.locator, "", "Source kind:", input.source,
         "", "MHTML filename (if any):", input.filename || "—", "", "Notes:"];
    email.href = `mailto:shirsivroni@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    email.textContent = copy.email;
    email.hidden = false;
    result.focus();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = values();
    setResult(evaluate(input), input);
  });

  form.addEventListener("change", () => {
    if (!result.hidden) {
      result.hidden = true;
      email.hidden = true;
    }
  });

})();
