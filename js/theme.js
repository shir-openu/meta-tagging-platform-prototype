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
    /* THE GROUPING RUNS WHETHER OR NOT THE BUTTON WAS CREATED HERE.
       2026-09-08. It used to live inside `if (!btn)`, so index.html - the one page that
       ships <button id="themeBtn"> in its own markup - skipped it entirely and kept a flat
       header of five independent flex items. Every OTHER page was grouped, which is exactly
       why it went unnoticed: the check passed on nine pages and the tenth was the home
       page. Whether a control was written in the HTML or made here says nothing about
       where it should sit. */
    var btn = document.getElementById("themeBtn");
    var head = document.querySelector(".pt-head, .dhead, header");
    if (!head) { apply(saved === "light" ? "light" : "dark"); return; }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "themeBtn";
      btn.className = "pt-btn theme";
    }
    {
      /* Sit beside the language control, whatever shape it takes. The entry page uses an
         <a href="index-he.html">; the define pages use <button id="langSwitch">, which the
         anchor-only selector missed - so the button landed on its own line under the
         breadcrumb instead of in the header row. Found by rendering the second page. */
      /* WHICH ELEMENT IS THE LANGUAGE CONTROL - ASKED IN PRIORITY ORDER, NOT AS ONE
         SELECTOR LIST.
         2026-09-08, twice. First the href patterns missed request-tagging-he.html, whose
         language link points at `request-tagging.html` - the English file, whose name
         carries no marker at all. Adding `[hreflang]` to the list then made it worse:
         `querySelector` returns the first match in DOCUMENT order, not in selector order,
         and on that same page the FIRST element matching anything in the list is the
         breadcrumb `<a class="pt-back" href="index-he.html">`. The breadcrumb was pulled
         into the button group and the English button was left behind at the far edge.
         So: ask the reliable questions first, exclude the breadcrumb explicitly, and only
         then fall back to guessing from a filename. */
      var lang = null;
      var TRIES = ["#langSwitch", ".lang-switch", "[hreflang]",
                   'a[href*="-he."]', 'a[href*="lang=he"]', 'a[href*="-en."]'];
      for (var t = 0; t < TRIES.length && !lang; t++) {
        var hits = head.querySelectorAll(TRIES[t]);
        for (var i = 0; i < hits.length; i++) {
          // A breadcrumb back to the platform is not a language control, and on the Hebrew
          // pages it points at a filename ending "-he.html" like one.
          if (hits[i].classList.contains("pt-back")) continue;
          lang = hits[i];
          break;
        }
      }
      /* ONE GROUP, SO THE CONTROLS CANNOT BE SPLIT BY A LINE BREAK.
         2026-09-08. Two goes at this were both wrong because both left the header a flat
         flex row of five independent items. Inserting the theme button AFTER the language
         control stranded it on its own line on method.html - the language control carries
         `margin-inline-start:auto`, which eats every free pixel, so the item after it had
         none. Moving the auto margin to the theme button instead just moved the break: on
         method.html the row measured 807px of an available 806, and the language button
         dropped to line two by ONE PIXEL. A layout that depends on the title's width is
         not fixed, it is lucky.
         So the controls are collected into one inline-flex box. The box is a single flex
         item: it carries the auto margin, it holds its own gap, and the header can only
         wrap it as a whole. Any page, any title length, any number of controls. */
      var group = document.createElement("span");
      group.className = "pt-controls";
      group.style.cssText =
        "display:inline-flex;gap:8px;align-items:center;flex:0 0 auto;margin-inline-start:auto";
      var about = head.querySelector("#aboutBtn");
      var anchor = about || lang;                 // where the group goes in the header
      if (anchor) anchor.parentNode.insertBefore(group, anchor);
      else head.appendChild(group);
      // The auto margin belongs to the group now, not to whichever control had it.
      if (about) { about.style.marginInlineStart = ""; group.appendChild(about); }
      group.appendChild(btn);
      if (lang) { lang.style.marginInlineStart = ""; group.appendChild(lang); }
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
