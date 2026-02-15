# KanjiVG
*Code For The* ***[kanjivg.tagaini.net][Website]*** *Website.*

---

## Content
*Relevant Files / Non-Library Files.*

<br>

- **[`_layouts/default.html`][Layouts]**

    *Layout For Every Page .*

- **[`_config.yml`][Config]**

    *Layout For Every Page .*

- **[`js/kanjiviewer.js`][Viewer]**

    *Kanji Visualization Logic .*

- **[`kanjivg`][Kanji]**

    ***[KanjiVG]*** *Github Submodule .*


[Layouts]: _layouts/default.html
[Config]: _config.yml
[Viewer]: js/kanjiviewer.js
[Kanji]: kanjivg

[KanjiVG]: https://github.com/KanjiVG/kanjivg

[Website]: https://kanjivg.tagaini.net/

## Desktop Launch (npm-only, system webview)

This repo can run in its own desktop window via NeutralinoJS (uses the OS webview runtime).

1. `npm install`
2. `npm run desktop:dev`

Build desktop binaries:

1. `npm run desktop:build`
