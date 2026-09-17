# werkzeuge

The small tools all three Lautstark products had each written for themselves.

Shared by [bildhaft](https://github.com/Lautstark/bildhaft),
[mitreden](https://github.com/Lautstark/mitreden) and
[vorlaut](https://github.com/Lautstark/vorlaut-editor). MIT.

## What is in it

Four things, none of them clever, all of them written between three and six
times before this package existed:

| import | what |
| --- | --- |
| `@lautstark/werkzeuge/download` | `download(blob, filename)`, `downloadJson(data, filename)` |
| `@lautstark/werkzeuge/filename` | `downloadSlug(name, fallback?)` — a Sammlung's name as a file's |
| `@lautstark/werkzeuge/changed` | `changes()` — `onChanged` / `touched`, conventions.md §2.2 |
| `@lautstark/werkzeuge/bytes` | `weighs(bytes)` — `63 MB` |
| `@lautstark/werkzeuge/dom` | `el` / `svg` / `fill` / `toggleClass` / `byId` |
| `@lautstark/werkzeuge/reactive-text` | `reactiveText(lookups)` — a lookup a Svelte component can draw from |

### `./dom`

Making an element, and finding one — and the reason this is one module rather
than four is a name, not the thirty lines.

Before it, `el` **built** a node in bildhaft and wochenwerk and **fetched** one
in mitreden, while vorlaut-editor called the fetcher `$` and had no builder at
all: `document.createElement` fifty-odd times, twenty-seven in one file. A
duplicate is merely wasteful. A name that means opposite things in sibling
repositories is a trap for whoever moves between them, which here is everybody.

So: **`el` makes, `byId` finds.** `$` is not offered — it reads well inside one
file and is a name nobody can search for in a package.

bildhaft's builder is the base; it had been through the most surfaces. Two rules
came from elsewhere and would have been lost by taking one copy whole, and both
are asserted in `test/dom.test.ts`:

- **an ARIA state is a word, not a bare attribute** (wochenwerk). `aria-checked=""`
  is not "checked", it is unreadable, and a control that is not the answer has to
  say `aria-checked="false"`. Two call sites there produced neither state and only
  looked right because a class beside them carried the paint.
- **`byId` throws rather than answering null** (vorlaut-editor). A missing id is a
  template and a module that have drifted apart, not a state two hundred call
  sites should branch on.

### `./sammlung`

The link that opens a published Sammlung: `…/?sammlung=erste-woerter` fetches
that entry off <https://lautstark.tech/sammlungen/> and hands back a `File`.

**The address carries an id, never a URL.** `?von=https://…` would be fewer
lines and is the version not to write — it turns a link into "fetch whatever
this says and import it", and what gets imported is a Sammlung a child then
reads. With an id there is one host it can come from and the regex is the whole
attack surface.

That regex is why this is here rather than copied three times. Not the thirty
lines: a regex nobody tests is one somebody relaxes when they need a character
through it, in whichever of three repositories they are standing in.

It imports nothing and has no language. What a product does with a `File`, and
what it says about it, stay the product's.

### `./reactive-text`

conventions.md §6.11. The one module here that is Svelte's, and the one that
ships as **source**.

```js
import { reactiveText } from '@lautstark/werkzeuge/reactive-text';
import { t as look, tn as lookMany } from '../i18n/index.js';

const words = reactiveText({ t: look, tn: lookMany });
export const { t, tn } = words;

export function setLang(code) {
  write(code);          // the product's own language state, which stays here
  words.moved();
}
```

A component that writes `{t("ui.settings")}` is now on the list to be drawn
again when `moved()` is called, and nothing has to remember to repaint. That
list is the point: what both products had before was a function walking every
`[data-i18n]` in the document plus a hand-kept set of redraws for the words that
were never in the markup, and the hand-kept set is what goes wrong — mitreden's
got it wrong twice and nothing went red either time.

**It does not carry the language.** mitreden's rune holds a `Lang`; vorlaut's
holds a counter, because its table is a live binding it does not own. Both keep
their own language state and both go on calling the plain table from everything
that is not drawing — an importer, a printed sheet's notes, a sentence handed to
a status line, all of which answer at the moment of a click and would answer in
the previous language if only the rune moved. What is shared is the trick.

A record rather than a lookup, because mitreden has two and they cannot share a
generic: `t` is typed over its `Key`, and `tn` takes a plural *stem* composed
into `${key}_one` or `${key}_other`, which is not one. Two calls would be two
runes for one `setLang` to bump. And `touched()` is readable, not bump-only, so
that a lookup which has to stay in the product can `void words.touched()` in its
own body.

**Two things a consumer owes it.** Both are §6.0's and both are silent:

- Your bundler must see the `svelte` export condition — it does, from
  `package.json` here, and `@sveltejs/vite-plugin-svelte` then excludes this
  package from dependency pre-bundling. Without that, dev mode compiles a second
  copy of the rune and the writer moves one while the readers watch the other.
- **Your vitest must inline it.** A `.svelte.ts` arriving from `node_modules` is
  externalised, the `$state` reaches no transform, and the import throws a
  ReferenceError out of a file the test is not about. Either
  `server.deps.inline: [/@lautstark\/werkzeuge/]` with a `compileModule`
  transform at `enforce: 'post'` — `vitest.config.ts` in this repository is
  twelve lines of exactly that, and mitreden's is the same twelve — or the full
  Svelte plugin, where the suite mounts components and can have it.

## There is no root import

`import { ... } from '@lautstark/werkzeuge'` does not resolve, on purpose.

This package is a bag of unrelated tools, and a barrel would let the one that
touches the DOM be imported into a module that has no DOM — `./changed`'s
callers are storage layers, and `./download`'s is a page. Four names in four
import lines say which of those a file is.

## Why a package at all

Three of these are ten lines or fewer, which is normally the argument against
one. conventions.md §5 #3 said so about two of them in as many words: they
"ride along with the storage work" and do not earn a package.

What changed is that the copies stopped agreeing, and the disagreement was
invisible. Of six copies of the download trigger, one revoked its blob URL
synchronously — a download that silently never begins — and one never put its
anchor in the document, so it never took it out again. Both had been that way
for months in code nobody had reason to re-read, and both are the kind of
failure that reports itself as "the browser did something odd".

That is what a shared copy is for: not the ten lines, but the one place where
being wrong is worth a test.

## What is deliberately not here

**`$`.** `el()` is here after all — `./dom` above says why, and why it makes
rather than fetches. The one-character id getter is what stays out: it reads
well inside one file and is a name nobody can search for in a package.

**Importing what `./sammlung` fetches.** It stops at the `File`. vorlaut makes
a Sammlung of one, mitreden reads sentences out of it, and bildhaft will do a
third thing; a shared "adopt" would be three products' storage in a package
that knows about none of them.

**`debounce` / `throttle`.** No product defines one. The inline
`setTimeout`/`clearTimeout` sites differ in delay and in what they need — a
flush door, a staleness re-check after an await — and the one case that
genuinely is shared already lives in `@lautstark/design/rename`.

**Two tables that look like this one's and must not become it.** mitreden's
`core/ids.ts` `slug()` and vorlaut's `data/store.ts` `safeName()` both hold a
German transliteration. Both have *frozen output*: one makes sentence ids that
are file names on a talker, the other makes IndexedDB keys that round-trip
through `.obz` and Sicherung files. Adding a letter to `./filename`'s table is
free; adding one to either of those renames files on somebody's device or
loses a picture. They keep their own copies, and say so.

## Use

```js
import { download, downloadJson } from '@lautstark/werkzeuge/download';
import { downloadSlug } from '@lautstark/werkzeuge/filename';

const stamp = new Date().toISOString().slice(0, 10);
downloadJson(await exportEverything(), `mitreden-sicherung-${stamp}.json`);
download(zip(files), `mitreden-${downloadSlug(name, 'sammlung')}-${stamp}.zip`);
```

`download` takes the filename **whole**. What a product calls its exports is
the product's, and the three do not agree: vorlaut composes `<name>-app.zip`
and stamps nothing, deliberately, while the other two date everything.

```js
import { changes } from '@lautstark/werkzeuge/changed';

const changed = changes();
export const onChanged = changed.onChanged;
const touched = changed.touched;   // called by writes, never by the page
```

A factory rather than a module holding one `Set`, because bildhaft has two of
these: one for the library, and one for "a symbol source became usable again".

## Install

Pinned by tag, like everything else in the family:

```json
"@lautstark/werkzeuge": "github:Lautstark/werkzeuge#v1.0.0"
```

`prepare` builds `dist/` on the consumer's machine, so there is nothing
committed here to go stale.
