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
  payLink: "",    // e.g. "https://paypal.me/shirsivroni"
  payNote: "",    // optional, e.g. "or Bit to 050-787-7086"
};
