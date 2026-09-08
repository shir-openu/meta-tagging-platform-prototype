/* The scoring intake, for BOTH language pages.
 *
 * It lives in one file for the same reason the price does: CLAUDE_B found today that the
 * price existed in two files with a comment in one of them claiming there was only one,
 * and nothing compared them. A second copy of this script would be the same defect with a
 * longer fuse - the two language pages would drift and only a reader would ever notice.
 * It picks its copy from <html lang>, so the pages differ in content and not in code.
 */
/* PAYMENT WIRING.
 *
 * Written by META_CLAUDE after CLAUDE_B correctly declined the track: PLATFORM/ is on its
 * never-touch-without-Shir's-authorisation list, and a peer cannot grant that.
 *
 * Two rules this file exists to keep:
 *   1. NO PAY BUTTON BEFORE THE CHECK. The button is created only on "accepted", and the
 *      area is emptied on every other outcome. A refused term has no button in the DOM.
 *   2. NO PRICE IN PROSE. Every figure comes from MTP_PAY.ACTIONS.score_def.
 *
 * One script for both language pages; it picks its copy from <html lang>.
 */
(function () {
  "use strict";
  var lang = document.documentElement.lang === "he" ? "he" : "en";
  var COPY = {
    en: {
      accepted: "This term can be scored. Paying opens the request; the board is delivered to the email you send from.",
      incomplete: "Answer every section, and name the term and the field.",
      refusedSettled: "A term with one settled definition has nothing to score. Nothing is charged, and there is nothing to pay for here.",
      unavailable: "Online payment is not switched on yet. Use “Email this request” below — your term goes by email and the fee is arranged there. Nothing is charged on this page.",
      paidTitle: "Payment received — keep this token",
      paidBody: "This receipt token is your proof of payment and how your request is matched. It has been added to the email below; send that email to complete the request.",
      emailToken: "Payment receipt token (keep this):",
      emailSubject: "Score a definition: ",
      emailPay: "To pay, use this link:"
    },
    he: {
      accepted: "אפשר לנקד את המונח הזה. התשלום פותח את הבקשה; הלוח נמסר לכתובת שממנה שלחתם.",
      incomplete: "יש לענות בכל הסעיפים, ולנקוב את המונח ואת התחום.",
      refusedSettled: "למונח עם הגדרה אחת מוסכמת אין מה לנקד. לא מבוצע חיוב, ואין על מה לשלם כאן.",
      unavailable: "תשלום מקוון עדיין לא הופעל. השתמשו ב„שליחת הבקשה בדוא”ל” שלמטה — המונח נשלח בדוא”ל והתשלום מתואם שם. בעמוד הזה לא מבוצע חיוב.",
      paidTitle: "התשלום התקבל — שמרו את האסימון",
      paidBody: "אסימון הקבלה הוא ההוכחה לתשלום וכך הבקשה מזוהה. הוסף לדוא”ל שלמטה; שלחו אותו כדי להשלים את הבקשה.",
      emailToken: "אסימון קבלת תשלום (שמרו אותו):",
      emailSubject: "ניקוד הגדרה: ",
      emailPay: "לתשלום, דרך הקישור הזה:"
    }
  }[lang];

  var form = document.getElementById("scorePreflight");
  var result = document.getElementById("preflightResult");
  var payArea = document.getElementById("payArea");
  var emailBtn = document.getElementById("eligibleEmail");
  if (!form || !result || !payArea || !emailBtn) return;

  /* A term arriving from the define page's dead end: request-scoring.html?term=potential */
  try {
    var q = new URLSearchParams(location.search).get("term");
    if (q) document.getElementById("term").value = q.slice(0, 120);
  } catch (e) { /* no URLSearchParams: the field simply starts empty */ }

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function show(state, text) {
    result.hidden = false;
    result.setAttribute("data-state", state);
    result.textContent = text;
  }

  function mailto(token) {
    var body = [
      "Term: " + document.getElementById("term").value,
      "Field: " + document.getElementById("field").value,
      "Defined more than one way: " + val("rivalry"),
      "Rival definitions I know of:",
      document.getElementById("rivals").value || "(none given)",
      "Corpus: " + val("corpus"),
      "Purpose: " + val("use"),
    ];
    if (token) body.push("", COPY.emailToken, token);
    /* The link route. Costs nothing when unset, and when set it means a visitor who cannot
       pay through the API can still pay - which is the whole difference between a service
       that earns and a service that is finished but idle. */
    var cfg = window.MTP_PAY_CONFIG || {};
    if (cfg.payLink) {
      body.push("", COPY.emailPay, cfg.payLink);
      if (cfg.payNote) body.push(cfg.payNote);
    }
    return "mailto:shirsivroni@gmail.com"
         + "?subject=" + encodeURIComponent(COPY.emailSubject + document.getElementById("term").value)
         + "&body=" + encodeURIComponent(body.join("\n"));
  }

  function paid(receipt) {
    payArea.innerHTML = "";
    var box = document.createElement("div");
    box.className = "preflight-result";
    box.setAttribute("data-state", "accepted");
    var h = document.createElement("b");
    h.textContent = COPY.paidTitle;
    var p = document.createElement("p");
    p.textContent = COPY.paidBody;
    var t = document.createElement("div");
    t.className = "sense-locator";
    t.style.marginTop = ".4rem";
    t.style.wordBreak = "break-all";
    t.textContent = receipt.token;
    box.appendChild(h); box.appendChild(p); box.appendChild(t);
    payArea.appendChild(box);
    emailBtn.href = mailto(receipt.token);
    emailBtn.hidden = false;
    box.scrollIntoView({ block: "nearest" });
  }

  function payFailed(msg) {
    var note = document.createElement("div");
    note.className = "preflight-result";
    note.setAttribute("data-state", "incomplete");
    note.textContent = msg;
    payArea.appendChild(note);
  }

  function offerPayment() {
    payArea.hidden = false;
    payArea.innerHTML = "";
    if (!window.MTP_PAY || !window.MTP_PAY.ready()) {
      /* Never an inert button. The email route still works and is stated plainly. */
      var note = document.createElement("div");
      note.className = "preflight-result";
      note.setAttribute("data-state", "incomplete");
      note.textContent = COPY.unavailable;
      payArea.appendChild(note);
      return;
    }
    var host = document.createElement("div");
    host.id = "paypalHost";
    payArea.appendChild(host);
    window.MTP_PAY.mount(host, {
      action: "score_def",
      details: {
        term: document.getElementById("term").value.slice(0, 60),
        field: document.getElementById("field").value.slice(0, 40),
        rivalry: val("rivalry"),
      },
      onPaid: paid,
      onError: payFailed,
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    payArea.hidden = true;
    payArea.innerHTML = "";
    emailBtn.hidden = true;

    var term = document.getElementById("term").value.trim();
    var field = document.getElementById("field").value.trim();
    var rivalry = val("rivalry");

    if (!term || !field || !rivalry || !val("corpus") || !val("use")) {
      show("incomplete", COPY.incomplete);
      result.focus();
      return;
    }
    /* The one refusal the browser can decide by itself: the visitor has told us the term is
       not contested. Nothing to score, so no payment is offered at all. */
    if (rivalry === "no") {
      show("refused", COPY.refusedSettled);
      result.focus();
      return;
    }
    show("accepted", COPY.accepted);
    emailBtn.href = mailto(null);
    emailBtn.hidden = false;
    offerPayment();
    result.focus();
  });
})();
