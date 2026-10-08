# Quote Cloud

A quotes website built with plain HTML, CSS and JavaScript (no build step).
Quotes come from a community mirror of the Quotable API:
https://github.com/Kurokeita/quotable

## Run it

Open `index.html` in a browser, or (better) start a small local server in this folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000. With a server, "copy" and "download as image" work best.

## Folders

```
├── index.html            Home: quote of the day + famous quotes
├── quote.html            All quotes, search (?query=), tags (?tag=), length filter
├── tag.html              List of tags
├── author.html           List of authors, or one author (?slug=)
├── favorites.html        Quotes saved with the ♥ button
│
├── assets/images/        logo, favicon, banner and the 10 card wallpapers
│
├── css/
│   ├── main.css          the only file the pages load, imports the rest in order
│   ├── variables.css     colors for the dark and light themes
│   ├── base.css          plain HTML elements (text, links, buttons, inputs)
│   ├── layout.css        header, banner, footer
│   ├── components.css    search box, quote cards, page buttons, messages
│   ├── pages/            styles used by only one page
│   └── responsive.css    phone / tablet / desktop changes (keep last)
│
└── js/
    ├── theme.js          loaded in <head>: picks dark or light before the page shows
    ├── shared/           code every page uses
    │   ├── settings.js       remembers small choices (theme, quote length, author sort)
    │   ├── api.js            API address, fetchJSON() (timeout + one retry), fixes broken names
    │   ├── ui.js             loading skeletons, error messages, toast pop-up
    │   ├── favorites-store.js  save / read favorites (localStorage)
    │   ├── quote-image.js    "download as image" (canvas)
    │   ├── quote-card.js     createQuoteCard() and its buttons
    │   ├── pagination.js     ← 1 … 4 [5] 6 … 85 → buttons
    │   └── layout.js         search boxes, theme button, back-to-top, keyboard shortcuts
    └── pages/            one file per page (home.js is for index.html)
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
<script src="js/shared/quote-card.js"></script>
<script src="js/shared/pagination.js"></script>
<script src="js/shared/layout.js"></script>
<script src="js/pages/home.js"></script>
```

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
| add a keyboard shortcut         | `SHORTCUTS` and `setupShortcuts()` in `js/shared/layout.js` |
| change the loading placeholders | `quoteSkeletons()` etc. in `js/shared/ui.js` + `.skeleton` in `css/components.css` |
| add a new page                  | copy `favorites.html`, add a file in `js/pages/`, add a link to the `<nav>` of every page |
