/// <reference types="svelte" />

/**
 * A lookup a component can draw from, and be drawn again when the words move.
 *
 * conventions.md §6.11. mitreden's `ui/words.svelte.ts` and vorlaut-editor's
 * `shell/live.svelte.ts` are the same trick under two names: a rune, `void` it
 * as the first statement of the lookup so that reading a word signs the reader
 * up for the next change, then delegate to the plain table. Six lines, and the
 * six are the subtle part — a component that writes `{t("ui.settings")}` has no
 * way to know a language switch happened, and the alternative is what both
 * products had before, a function walking every `[data-i18n]` in the document
 * plus a hand-kept list of the words that were never in the markup. That list
 * is the thing that is wrong: mitreden's got it wrong twice, the backup panel
 * and then the three scheme labels, and neither time did anything go red.
 *
 * **It does not carry the language.** mitreden's rune holds a `Lang` and four
 * call sites read it as a value; vorlaut's holds a counter because its table is
 * a live binding it does not own. Both keep their own language state and their
 * own `setLang`, and both go on calling the plain table from everything that is
 * not drawing — the file importer, the printed sheet notes, the sentence handed
 * to a status line all answer at the moment of a click and would answer in the
 * previous language if only the rune moved. What is shared here is the trick.
 * The consumer module does not go away.
 *
 * ## Why a record rather than a lookup
 *
 * mitreden has two: `t`, typed over its own `Key`, and `tn`, which takes a
 * plural **stem** (`'count'`) composed into `${key}_one` or `${key}_other` and
 * is not a member of `Key`. One generic parameter cannot be both. And wrapping
 * them in two calls would make two independent runes, which a single writer —
 * one `setLang` — would have to remember to bump twice. So the whole record
 * goes in and the same shape comes back, reactive, sharing one rune.
 *
 * `touched()` is **readable** rather than bump-only for the same reason: a
 * product's own lookup that cannot be passed in — one composing a key, one
 * reading a table this module has never heard of — needs `void touched()` in
 * its own body, and a function returning `void` cannot be made a dependency.
 *
 * A factory, not a module holding one rune: `./changed` argues it and the
 * argument is the same here. The shape is what is shared, not the instance.
 * Two independent sets of words are two calls, and moving one leaves the other
 * where it was.
 *
 * ## What a consumer owes
 *
 * This module ships **as source**, behind the `svelte` export condition, and is
 * excluded from `tsconfig.build.json` — `tsc` emits `$state(0)` as a call to an
 * undefined identifier and would publish it. Two consequences:
 *
 *   - **The `svelte` condition is not optional.** Without it dev mode
 *     pre-bundles a second compiled copy, and for a rune that means two of it,
 *     with the writer moving one and the readers watching the other. Correct in
 *     the build and half-correct in dev, which no test in this family can see.
 *   - **A vitest that externalises `node_modules` never compiles this.** The
 *     `$state` reaches no transform and the import throws a ReferenceError out
 *     of a file the test is not about. mitreden is the case: it cannot use the
 *     full Svelte plugin in vitest and ships twelve lines of `compileModule` at
 *     `enforce: 'post'` instead, and the toolchain's vitest base sets no
 *     `server.deps.inline`. A consumer whose suite imports this owes itself one
 *     of the two — `server.deps.inline: [/@lautstark\/werkzeuge/]`, or the
 *     plugin. `test/reactive-text.test.ts` here is the smaller of them written
 *     out.
 */

/** The rune, in the two shapes a caller needs it. */
export interface Moves {
  /** Read this where a lookup of your own has to become a dependency: `void
   *  touched();` as the first statement, exactly as the wrapped ones do. The
   *  number it answers means nothing — only that it was read. */
  touched(): number;
  /** The words are different now. Called by whatever changed them. */
  moved(): void;
}

/** Any record of lookups: functions answering a string. */
export type Lookups = Record<string, (...a: never[]) => string>;

/**
 * The same lookups, each one now a dependency of whoever called it, and one
 * rune behind all of them.
 *
 * Throws if a lookup is called `touched` or `moved`. The returned shape says
 * both names are the rune's, and a table that brought its own would be shadowed
 * silently — a label that is right in the types and stale on the screen.
 */
export function reactiveText<Fs extends Lookups>(lookups: Fs): Fs & Moves {
  for (const name of ['touched', 'moved']) {
    if (name in lookups) throw new Error(`reactiveText: "${name}" is the rune's name, not a lookup's`);
  }

  let moves = $state(0);
  const reactive: Lookups = {};
  for (const name of Object.keys(lookups)) {
    const look = lookups[name] as (...a: never[]) => string;
    reactive[name] = (...args: never[]): string => {
      void moves;
      return look(...args);
    };
  }

  return {
    ...reactive,
    touched: (): number => moves,
    moved: (): void => { moves += 1; },
  } as Fs & Moves;
}
