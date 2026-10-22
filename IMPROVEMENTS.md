# Ideas to improve the site

Suggestions from a review on 2026-10-22. Ticked items are done.

## Follow-ups from the sticky footer

- [x] 1. **Back-to-top button covers the footer.** It sat 20px from the bottom, the sticky footer is taller. Raise its `bottom`.
- [x] 2. **Sticky footer eats space on phones.** Stop it sticking below 600px.

## Worth doing

- [ ] 3. **One native "Share" button** instead of the removed WhatsApp/X links. `navigator.share()` opens the phone's share menu (WhatsApp, Telegram, email…); where it isn't supported, copy the quote instead (reuse `getShareText()` and `copyText()` in `js/shared/quote-card.js`).
- [ ] 4. **A page for one quote**, e.g. `quote.html?id=...`, so a single quote can be linked to or bookmarked.
- [ ] 5. **Back up favorites and my quotes.** They only live in `localStorage`, so clearing the browser or changing device loses them. Add "Export / Import JSON" on the favorites and my-quotes pages.
- [ ] 6. **Page descriptions and preview tags.** No page has `<meta name="description">` or Open Graph tags (search results and link previews in chat apps use them).

## Smaller polish

- [x] 7. **Faster font loading.** The Google Font was loaded with `@import` inside `css/main.css`, so it only started after the CSS arrived. It's now a `<link>` in every page with `preconnect` and `display=swap`.
  - Not done: `main.css` still `@import`s 11 files one after another. Joining them into one file would be faster, but needs a build step or giving up the split files.
- [x] 8. **Accessibility.** The active nav link now has `aria-current="page"`, and the footer copyright is a `<p>` instead of an `<h4>` (it isn't a heading).
- [x] 9. **Typo.** `todayQuoteWapper` → `todayQuoteWrapper` in `js/pages/home.js`.
