# Helping with the notes

Thanks for helping make these notes better for everyone taking IB Computer Science.

## The quickest way: open an issue

You don't need to touch any code.

- **Something is wrong:** [send a correction](https://github.com/d1v4nchik/dpcomputerscience27/issues/new?template=correction.yml). Give the topic code (for example *A2.1*), what's wrong, and a source if you have one (the subject guide, a textbook or a markscheme).
- **An idea:** [make a suggestion](https://github.com/d1v4nchik/dpcomputerscience27/issues/new?template=suggestion.yml).

## Editing the site yourself

It's a static site with no build step and no dependencies. To run it on your computer:

```bash
git clone https://github.com/d1v4nchik/dpcomputerscience27.git
cd dpcomputerscience27
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static file server works. Opening `index.html` by double-clicking won't load the topic pages, because browsers block that for files on disk.

```
.
├── index.html                 # Page shell
├── sw.js                      # Saves the site for offline use and "Install app"
├── manifest.webmanifest       # App name and icons for "Install app"
├── assets/
│   ├── css/style.css          # All styles, light and dark themes
│   ├── pages.html             # Every topic page and diagram, loaded after the first screen
│   ├── js/data.js             # Course content: topics, glossary, flashcards, question bank, videos
│   ├── js/app.js              # Router, search, flashcards, practice and number drill
│   ├── js/offline.js          # Offline support and the "newer copy" banner
│   └── img/                   # Social preview image and app icons
├── tools/build_offline.py     # Packs everything into the one-file offline download
├── favicon.svg
├── robots.txt
└── sitemap.xml
```

The site is published with GitHub Pages straight from `main`. On every change to the site, the
*Offline copy* workflow rebuilds `ib-cs-notes-offline.html` and attaches it to the
[`offline` release](https://github.com/d1v4nchik/dpcomputerscience27/releases/tag/offline). To build
it yourself, run `python3 tools/build_offline.py`.

When you change `app.js`, `data.js` or `style.css`, bump the `?v=` number on their tags in
`index.html` so browsers fetch the new file.

## Ground rules

- Keep explanations in plain words, and match the wording of the 2027 subject guide for definitions.
- Don't paste copyrighted IB material such as past paper questions or markschemes. Write your own questions in the same style.
- Be kind in issues and reviews. Everyone here is a student or a teacher.
