/* Bright / dark view, for every page on the platform.

   Shir, 2026-09-08, of Res-Quill: "IT CONTAINS A DARK AS WELL AS BRIGHT VIEW."

   ONE FILE, NOT ONE COPY PER PAGE. The platform has twelve pages and the toggle has to
   behave identically on all of them, including the Hebrew twins. A copy in each page is
   how the twelve drift apart, and the preference has to be shared anyway - a visitor who
   picks the bright view on the entry page and lands in the dark on the define page has
   been told the setting did not take.

   THE WAVES ARE NOT TOUCHED. The light view raises the opacity of the existing wave layer
   in CSS so the same strokes stay visible on a pale ground. shell.css is unchanged and the
   markup is unchanged; dark mode renders exactly what it rendered before.

   The button is created here rather than written into twelve files, so a page opts in by
   loading this script and needs no markup of its own. If a page already has a #themeBtn,
   that one is used.
*/
(function () {
  var root = document.documentElement;
  var KEY = "mtp-theme";

  function label(mode, lang) {
    if (lang === "he") return mode === "light" ? "תצוגה כהה" : "תצוגה בהירה";
    return mode === "light" ? "Dark view" : "Bright view";
  }

  function apply(mode) {
    if (mode === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    var btn = document.getElementById("themeBtn");
    if (btn) {
      var lang = (document.documentElement.lang || "en").slice(0, 2);
      btn.textContent = label(mode, lang);
      btn.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
    }
  }

  function current() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  // Read the saved preference BEFORE first paint where possible; this script is loaded in
  // <head> with `defer` on pages that can, and at the end of <body> on those that cannot.
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  function wire() {
    var btn = document.getElementById("themeBtn");
    if (!btn) {
      // No markup on this page: put the control beside the language button if there is a
      // header to put it in, and do nothing at all if there is not.
      var head = document.querySelector(".pt-head, .dhead, header");
      if (!head) { apply(saved === "light" ? "light" : "dark"); return; }
      btn = document.createElement("button");
      btn.id = "themeBtn";
      btn.className = "pt-btn theme";
      /* Sit beside the language control, whatever shape it takes. The entry page uses an
         <a href="index-he.html">; the define pages use <button id="langSwitch">, which the
         anchor-only selector missed - so the button landed on its own line under the
         breadcrumb instead of in the header row. Found by rendering the second page. */
      var lang = head.querySelector(
        '#langSwitch, a[href*="-he."], a[href*="lang=he"], a[href*="-en."]');
      // AFTER the language control, not before it. The language button carries
      // `margin-inline-start:auto`, which is what pushes the group to the far edge;
      // inserting ahead of it left the theme button stranded beside the title.
      if (lang) lang.parentNode.insertBefore(btn, lang.nextSibling);
      else head.appendChild(btn);
    }
    btn.onclick = function () {
      var next = current() === "light" ? "dark" : "light";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    };
    apply(saved === "light" ? "light" : "dark");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
