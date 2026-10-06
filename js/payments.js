/* PAYMENTS — the one place the browser talks about money.
 *
 * 2026-09-08. Two paid actions, both PayPal, both manual services:
 *   tag_paper  $2.00
 *   score_def  $2.50
 *
 * WHY A SERVER AT ALL. PLATFORM/ is GitHub Pages and is static. A PayPal capture needs the
 * secret key, and a secret key in a static page is not a secret. So the browser holds only the
 * PUBLIC client id, and create/capture go to our own functions in PAYMENTS/ on Vercel. This
 * file never sees PAYPAL_SECRET and must never be given it.
 *
 * WHAT THE VISITOR ENDS UP WITH. A receipt token. It is the only proof of payment that reaches
 * the intake email, and it is how Shir matches a payment to a request. Show it, tell them to
 * keep it, and put it in the mailto body.
 *
 * ONE PLACE HOLDS THE PRICE. Every page reads MTP_PAY.ACTIONS[...] .price. A number typed into
 * prose goes stale the moment the price moves, and a stale price on a page that takes money is
 * the worst bug available here.
 */
(function () {
  "use strict";

  /* The API origin. Empty string until Shir's Vercel project exists, which is the whole of
     what "payments are not available yet" means: the page renders its unavailable state and
     no button is drawn. Set by PLATFORM/js/payments.config.js, which is written at deploy
     time and is the only file that changes when the endpoint moves. */
  var API = (window.MTP_PAY_CONFIG && window.MTP_PAY_CONFIG.api) || "";
  var CLIENT_ID = (window.MTP_PAY_CONFIG && window.MTP_PAY_CONFIG.clientId) || "";

  var ACTIONS = {
    tag_paper: { price: "2.00", currency: "USD", label: "Tag a paper" },
    score_def: { price: "2.50", currency: "USD", label: "Score a definition" },
  };

  var sdkPromise = null;

  function loadSdk() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      if (!CLIENT_ID) { reject(new Error("no client id")); return; }
      if (window.paypal) { resolve(window.paypal); return; }
      var s = document.createElement("script");
      s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(CLIENT_ID) +
              "&currency=USD&intent=capture&components=buttons";
      s.onload = function () {
        if (window.paypal) resolve(window.paypal);
        else reject(new Error("the PayPal SDK loaded but defined nothing"));
      };
      /* A blocked or offline SDK must NOT leave a dead button on the page. It rejects, the
         caller shows its unavailable state, and the visitor is told rather than left
         clicking something inert. */
      s.onerror = function () { reject(new Error("the PayPal SDK could not be loaded")); };
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  function post(path, body) {
    return fetch(API + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j && j.error ? j.error : "the payment service refused (" + r.status + ")");
        return j;
      });
    });
  }

  /* ready() answers a NARROW question: can a PayPal button be mounted? It needs the API and
     the client id, and only mount() should ask it.

     canSell() is the question the SITE cares about: is there any way at all for somebody to
     pay? A payment LINK is a way. Conflating the two is what kept the paid cards hidden on a
     site whose payment link was already live - the API was built first, so its readiness
     became the gate for everything, and the simpler route that actually works could not
     switch the cards on. */
  function ready() { return !!(API && CLIENT_ID); }
  function payLink() { return (window.MTP_PAY_CONFIG && window.MTP_PAY_CONFIG.payLink) || ""; }
  function canSell() { return ready() || !!payLink(); }

  function mount(el, opts) {
    opts = opts || {};
    var action = opts.action;
    var onPaid = opts.onPaid || function () {};
    var onError = opts.onError || function () {};

    if (!el) { onError("no place to put the payment button"); return; }
    if (!ACTIONS[action]) { onError("unknown action: " + String(action)); return; }
    if (!ready()) { onError("Payments are not switched on yet."); return; }

    loadSdk().then(function (paypal) {
      paypal.Buttons({
        style: { layout: "vertical", shape: "rect", label: "pay", height: 44 },

        createOrder: function () {
          /* The AMOUNT IS NOT SENT FROM THE BROWSER. The function looks the price up from the
             action name on the server. Anything the page could put in this request, a visitor
             could edit in the console. */
          return post("/api/create-order", { action: action, details: opts.details || {} })
            .then(function (j) { return j.id; });
        },

        onApprove: function (data) {
          return post("/api/capture-order", { orderID: data.orderID, action: action })
            .then(function (j) {
              /* The server has re-read the captured amount from PayPal and compared it with
                 its own price table before signing this. A receipt that arrives here has been
                 verified against PayPal, not against what this page believed. */
              onPaid({
                token: j.token,
                action: j.action,
                amount: j.amount,
                currency: j.currency,
                paidAtUtc: j.paidAtUtc,
              });
            })
            .catch(function (e) {
              /* Money may well have moved. Never tell the visitor the payment failed when what
                 failed was our record of it. */
              onError("Your payment went through, but we could not record it. Do not pay again"
                    + " — email shirsivroni@gmail.com with PayPal order " + data.orderID + ".");
            });
        },

        onError: function (e) { onError("PayPal reported an error: " + (e && e.message ? e.message : "unknown")); },
        onCancel: function () { onError("Payment cancelled. Nothing was charged."); },
      }).render(el);
    }).catch(function (e) {
      /* NEVER HAND A VISITOR AN INTERNAL STRING. This used to pass e.message straight through,
         so a page showed "the PayPal SDK could not be loaded" - developer text, in a box a
         buyer reads, at the moment they are trying to pay. Seen in
         FIGURES/payments/scoring_accepted_offline_dark.png, not in any check.
         The detail still exists, in the console, where it is useful. */
      if (window.console && console.warn) console.warn("payments:", e && e.message);
      onError("Online payment is not available right now. Use the email button below —"
            + " nothing is charged on this page.");
    });
  }

  window.MTP_PAY = { ACTIONS: ACTIONS, mount: mount, ready: ready,
                     canSell: canSell, payLink: payLink,
                     payNote: function () { return (window.MTP_PAY_CONFIG && window.MTP_PAY_CONFIG.payNote) || ""; } };

  /* THE PAID CARDS ARE HIDDEN UNTIL PAYMENTS CAN ACTUALLY TAKE MONEY.
     Until 2026-09-08 they were hidden by two CSS blocks whose comments said "delete this to
     bring the button back" - a switch a person had to remember to throw. This throws itself:
     with no client id and no API the site advertises nothing it cannot sell, and the moment
     payments.config.js is filled in the cards appear on every page at once.
     Set on <html> before first paint where possible, so a paid card never flashes and
     vanishes. */
  document.documentElement.setAttribute("data-payments", canSell() ? "on" : "off");

  /* Every price on the page comes from ACTIONS, never from prose. A number typed into HTML
     goes stale the moment the price moves, and a stale price on a page that takes money is
     the worst bug available here. */
  function fillPrices() {
    var nodes = document.querySelectorAll("[data-price-for]");
    for (var i = 0; i < nodes.length; i++) {
      var a = ACTIONS[nodes[i].getAttribute("data-price-for")];
      if (a) nodes[i].textContent = "$" + a.price;
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fillPrices);
  } else {
    fillPrices();
  }
})();
