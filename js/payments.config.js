/* The only file that changes when the payment endpoint moves or the account changes.
 *
 * Both values are PUBLIC. `clientId` is PayPal's public client id, which is designed to sit in
 * a page; `api` is the address of our own functions. The SECRET lives only in Vercel's
 * environment and must never appear in PLATFORM/.
 *
 * Empty means "payments are not switched on yet", and that is a real, rendered state on every
 * page that can take money: no button is drawn, and the visitor is told, instead of being left
 * with something inert to click. Shir fills these in when her PayPal app and Vercel project
 * exist; nothing else in the site changes.
 */
window.MTP_PAY_CONFIG = {
  api: "",        // e.g. "https://meta-tagging-payments.vercel.app"
  clientId: "",   // PayPal REST app client id — sandbox first, then live

  /* THE ROUTE THAT WORKS WITHOUT ANY OF THE ABOVE. 2026-09-08.
     The PayPal API needs a BUSINESS account, and a business account in Israel needs a
     registration number Shir does not have. That is a tax-authority question, not a coding
     one, and it stopped the whole build dead after the code was finished and deployed.
     A payment LINK needs none of it: paypal.me works on a personal account, so does Bit,
     so does a bank transfer. At two requests a day a link in an email IS the payment
     system, and the API above is for volume that does not exist yet.
     Fill this in and every accepted request carries it. Leave it empty and the pages say
     the fee is arranged by email, exactly as they do now. */
  /* PAUSED BY SHIR, 2026-09-09: "something is not working yet. hide the payment buttons
     and make them not responsive to clicks. but dont erase them and keep everything
     including the design."

     Emptying these two lines is the whole switch. canSell() goes false, <html> carries
     data-payments="off", and the rule in platform.css hides every [data-paid-card] with
     `display:none` AND `pointer-events:none` - hidden and unclickable, in one place, for
     both languages and both themes. The request pages stop drawing a Pay button and say
     the fee is arranged by email instead.

     NOTHING IS DELETED. The cards, the gold buttons, the card icon, the prices on the
     labels, the whole design and every line of the payment code are exactly where they
     were. Putting the two values back below switches it all on again.

         payLink: "https://www.paypal.com/paypalme/shirsivroni",
         payNote: "Or send to shirsivroni@gmail.com in PayPal - any PayPal account can.",
  */
  payLink: "",
  payNote: "",
};
