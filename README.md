# Quote Cloud

A quotes website built with plain HTML, CSS and JavaScript (no build step).
Quotes come from a community mirror of the Quotable API:
https://github.com/Kurokeita/quotable

## Run it

Open `index.html` in a browser, or (better) start a small local server in this folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000. With a server, "copy", "download as image"
and offline mode work best (offline mode needs a server).

## Folders

```
├── index.html            Home: quote of the day + famous quotes
├── quote.html            All quotes, search (?query=), tags (?tag=), length filter
├── tag.html              List of tags
├── author.html           List of authors, or one author (?slug=)
├── favorites.html        Quotes saved with the ♥ button, with your notes and collections
├── my-quotes.html        Write, edit and delete your own quotes
├── sw.js                 service worker: makes the site work offline (must stay in this folder)
│
├── assets/images/        logo, favicon, banner and the 10 card wallpapers
│
├── css/
│   ├── main.css          the only file the pages load, imports the rest in order
│   ├── variables.css     colors for the dark and light themes
│   ├── base.css          plain HTML elements (text, links, buttons, inputs)
│   ├── layout.css        header, banner, footer
│   ├── components.css    search box, quote cards, page buttons, messages
│   ├── pages/            styles used by only one page (tags, authors, favorites, my-quotes)
│   └── responsive.css    phone / tablet / desktop changes (keep last)
│
└── js/
    ├── theme.js          loaded in <head>: picks dark or light before the page shows
    ├── shared/           code every page uses
    │   ├── settings.js       remembers small choices (theme, quote length, author sort)
    │   ├── api.js            API address, fetchJSON() (timeout + one retry), fixes broken names
    │   ├── ui.js             loading skeletons, error messages, toast pop-up
    │   ├── favorites-store.js  favorites, notes and collections (localStorage)
    │   ├── quote-image.js    "download as image": draws the quote on a canvas
    │   ├── image-dialog.js   the window to pick image size, text size and background
    │   ├── quote-card.js     createQuoteCard() and its buttons
    │   ├── pagination.js     ← 1 … 4 [5] 6 … 85 → buttons
    │   └── layout.js         search boxes, theme button, back-to-top, keyboard shortcuts
    └── pages/            one file per page (home.js is for index.html)
                              my-quotes.js also saves your own quotes
```

## How the JavaScript fits together

The files are plain `<script>` tags (not modules), so the site also works when
`index.html` is opened by double-clicking it. Everything a shared file
declares can be used by the files loaded after it.

Every page loads the shared files in this order, then its own page file last:

```html
<script src="js/shared/settings.js"></script>
<script src="js/shared/api.js"></script>
<script src="js/shared/ui.js"></script>
<script src="js/shared/favorites-store.js"></script>
<script src="js/shared/quote-image.js"></script>
<script src="js/shared/image-dialog.js"></script>
<script src="js/shared/quote-card.js"></script>
<script src="js/shared/pagination.js"></script>
<script src="js/shared/layout.js"></script>
<script src="js/pages/home.js"></script>
```

## Offline mode

`sw.js` is a *service worker*: a script the browser runs in the background, between
the pages and the internet. It is registered in `registerServiceWorker()` in
`js/shared/layout.js` (only on `http://` or `https://`, not on `file://`).

| Request                            | How it is answered                         | Cache name           |
| ---------------------------------- | ------------------------------------------ | -------------------- |
| our pages, CSS, JS and pictures    | internet first, saved copy when offline    | `quote-cloud-app-v1` |
| quotes API                         | internet first, saved copy when offline (last 150 answers) | `quote-cloud-data-v1` |
| font (Google Fonts) and icons (unpkg) | saved copy first, they never change     | `quote-cloud-cdn-v1` |

- All pages and pictures are saved on the first visit, so every page opens offline.
- Quotes are only there offline if you saw them while online.
- When the API answer is a saved copy, `sw.js` adds an `X-Saved-Copy` header. `fetchJSON()`
  sees it and the "You are offline" bar appears under the header.
- "Internet first" means your code changes show up on the next reload, as usual.

**Added a file to the site?** Add it to `APP_FILES` in `sw.js` and change `CACHE_VERSION`
(e.g. to `'v2'`), so browsers save the new list and delete the old caches.

**Want to start fresh while testing?** Chrome DevTools → Application → Service workers →
Unregister, then Storage → Clear site data. To try offline mode: DevTools → Network → Offline.

## What is saved in the browser

Everything below lives in `localStorage`, so it stays on this computer and browser only.

| Key               | What                                             | Code |
| ----------------- | ------------------------------------------------ | ---- |
| `favoriteQuotes`  | favorite quotes, each with its `note` and `collections` (ids) | `js/shared/favorites-store.js` |
| `quoteCollections`| your collections, like `{ id, name }`            | `js/shared/favorites-store.js` |
| `myQuotes`        | quotes you wrote                                 | `js/pages/my-quotes.js` |
| `theme`, `quoteLength`, `authorSort`, `imageSize`, `imageTextSize` | small choices | `js/shared/settings.js` |

Your own quotes are stored in the same shape as quotes from the API
(`content`, `author.name`, `tags`), plus `mine: true`, so `createQuoteCard()`
can show them. Cards with `mine: true` get edit and delete buttons instead of the heart.

## Keyboard shortcuts

| Key   | Does                       |
| ----- | -------------------------- |
| `/`   | jump to the search box     |
| `R`   | random quote (home page)   |
| `←` `→` | previous / next page     |
| `T`   | switch dark / light theme  |
| `?`   | show the list of shortcuts |

They are set up in `setupShortcuts()` in `js/shared/layout.js`, and are ignored
while you are typing in a box.

## Common changes

| I want to...                    | Change                                      |
| ------------------------------- | ------------------------------------------- |
| use a different quotes API      | `API_URL` in `js/shared/api.js`             |
| change theme colors             | `css/variables.css`                         |
| change how a quote card looks   | `js/shared/quote-card.js` + `css/components.css` |
| add a wallpaper                 | add `wallpaperN.jpeg` to `assets/images/wallpapers/` and update `WALLPAPER_COUNT` in `js/shared/quote-card.js` |
| add an image size (download)    | `IMAGE_SIZES` in `js/shared/quote-image.js` |
| add a keyboard shortcut         | `SHORTCUTS` and `setupShortcuts()` in `js/shared/layout.js` |
| change the loading placeholders | `quoteSkeletons()` etc. in `js/shared/ui.js` + `.skeleton` in `css/components.css` |
| change the rules for your own quotes | `QUOTE_MIN`, `QUOTE_MAX`, `AUTHOR_MAX` and `checkQuote()` in `js/pages/my-quotes.js` |
| add a new page                  | copy `tag.html` (the simplest page), add a file in `js/pages/`, add a link to the `<nav>` of every page |
