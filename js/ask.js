/* One field, one button, one payment. All four request pages.
 *
 * Shir, 2026-09-08: "תעיפי משם את כל הפרטים, לא צריך כלום, רק להעלות את המאמר או רק לכתוב
 * את המושג שרוצים להגדיר. כל השאר אפשר להוציא מהמאמר עצמו."
 *
 * She is right, and it is the better design on the merits. The old intake asked six
 * questions - licence, full text, selectable sentences, language, item kind, source shape -
 * and every one of those answers is READ FROM THE PAPER once we have it. A form that asks a
 * person to tell us what the document will tell us anyway exists for the builder's
 * convenience, not the visitor's. It also asked them to pre-judge their own request, which
 * is our job and the whole reason there is a manual review.
 *
 * (This file was rewritten after an edit script truncated it to zero bytes: it opened the
 * file for writing, then the write itself raised on a bad character. `open(...,"w")` empties
 * the file BEFORE the content arrives, so a failing write leaves nothing behind. The site
 * kept serving a 0-byte script and the pay button simply stopped existing, with no error in
 * the console. Build the whole string first, write once.)
 */
(function () {
  "use strict";
  var he = document.documentElement.lang === "he";
  var CARD_SVG = '<svg class="coin" viewBox="0 0 20 14" width="19" height="13"'
      + ' aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">'
      + '<rect x="1" y="1" width="18" height="12" rx="2"/><path d="M1 5.2h18"/>'
      + '<path d="M4 9.6h3.4"/></svg>';
  var COPY = he ? {
    pay: "לתשלום",
    sendFirst: "נפתח PayPal. שלחו גם את הדוא״ל, כדי שנדע במה מדובר.",
    email: "שליחת הבקשה בדוא״ל",
    empty: "צריך למלא את השדה.",
    offline: "תשלום מקוון עדיין לא הופעל. שלחו את הבקשה בדוא״ל והתשלום יתואם שם.",
    subject: "בקשה: "
  } : {
    pay: "Pay",
    sendFirst: "Opens PayPal. Send the email too, so we know what it is for.",
    email: "Email this request",
    empty: "This field is needed.",
    offline: "Online payment is not switched on yet. Send the request by email and the fee is arranged there.",
    subject: "Request: "
  };

  var form = document.getElementById("askForm");
  var field = document.getElementById("askField");
  var out = document.getElementById("askOut");
  if (!form || !field || !out) return;

  /* A term arriving from the board's dead end: request-scoring.html?term=potential */
  try {
    var q = new URLSearchParams(location.search).get("term");
    if (q) field.value = q.slice(0, 120);
  } catch (e) { /* no URLSearchParams; the field simply starts empty */ }

  var action = /scoring/.test(location.pathname) ? "score_def" : "tag_paper";

  function price() {
    try { return "$" + window.MTP_PAY.ACTIONS[action].price; } catch (e) { return ""; }
  }
  function link() {
    try { return window.MTP_PAY.payLink(); } catch (e) { return ""; }
  }

  function mailto() {
    var f = document.getElementById("askFile");
    var body = [];
    if (field.value.trim()) body.push(field.previousElementSibling.textContent + ": " + field.value);
    if (f && f.files && f.files.length) body.push("(attach: " + f.files[0].name + ")");
    if (link()) body.push("", link());
    var what = field.value.trim() || (f && f.files && f.files.length ? f.files[0].name : "");
    return "mailto:shirsivroni@gmail.com?subject=" + encodeURIComponent(COPY.subject + what)
         + "&body=" + encodeURIComponent(body.join("\n"));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    out.innerHTML = "";
    /* A FILE IS AN ANSWER. Shir uploaded agrawal2009.pdf and the page still said "This field
       is needed", because the check only looked at the text box. The whole point of this
       page is "the paper, or the term" - and an attached paper IS the paper. Asking for a
       DOI as well is asking twice for the same thing. */
    var fEl = document.getElementById("askFile");
    var hasFile = !!(fEl && fEl.files && fEl.files.length);
    if (!field.value.trim() && !hasFile) {
      out.hidden = false;
      var w = document.createElement("p");
      w.className = "ask-warn";
      w.textContent = COPY.empty;
      out.appendChild(w);
      field.focus();
      return;
    }
    out.hidden = false;

    if (link()) {
      var a = document.createElement("a");
      a.className = "ask-pay";
      a.href = link();
      a.target = "_blank";
      a.rel = "noopener";
      /* The glyph U+1FA99 draws as a pale outline on this platform and vanishes against
         the gold. An inline SVG in currentColor is the button's own ink and cannot. */
      a.innerHTML = CARD_SVG;
      a.appendChild(document.createTextNode(" " + COPY.pay + " " + price()));
      out.appendChild(a);
    } else {
      var n = document.createElement("p");
      n.className = "ask-warn";
      n.textContent = COPY.offline;
      out.appendChild(n);
    }

    var em = document.createElement("a");
    em.className = "ask-email";
    em.href = mailto();
    em.textContent = COPY.email;
    out.appendChild(em);

    var note = document.createElement("p");
    note.className = "ask-note";
    note.textContent = COPY.sendFirst;
    out.appendChild(note);
    out.scrollIntoView({ block: "nearest" });
  });

  /* The price is never typed into the page. */
  function fill() {
    var n = document.querySelector("[data-price-for]");
    if (n && price()) n.textContent = price();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();
})();
