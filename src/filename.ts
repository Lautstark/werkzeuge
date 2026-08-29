/**
 * What a download is called, which is not what a key is called.
 *
 * This module is vorlaut's `shell/filename.ts`, moved. That file was written
 * on the way here and says so: its own header calls itself the landing site,
 * and it copied mitreden's transliteration table character for character "so
 * that the shared one which eventually replaces all three has a
 * transliteration to inherit rather than three to choose between". This is
 * that shared one, and it inherited exactly that.
 *
 * ## The three rules it replaces, and what changed
 *
 * All three products sanitised a Sammlung's name into a download filename, and
 * all three did it differently. `Häufige Wörter!` came out as:
 *
 *     mitreden   häufige-wörter          lowercased, spaces to `-`
 *     bildhaft   Häufige Wörter          spaces and capitals kept
 *     vorlaut    Haeufige_Woerter_       umlauts spelled out, case kept
 *
 * vorlaut's is the rule here, and the reasoning is that a download filename
 * has neither half of what makes mapping right. **Nothing reads it back**, so
 * there is no round trip to protect; and **a person reads it**, so a name with
 * holes punched through the middle of its words is the whole cost with none of
 * the benefit. `ae` and not `a` is the entire point of the table: German
 * spells the umlaut out when it cannot draw it, so "Woerter" is a word
 * somebody recognises and "Worter" is not one.
 *
 * mitreden's *shape* around its table is deliberately not inherited — it
 * lowercases, joins on `-` and cuts to six words, because its slugs are ids
 * that a talker may already hold. These are file names on somebody's disk.
 *
 * ## What this must never become
 *
 * mitreden's `core/ids.ts` holds the same table and keeps its own copy on
 * purpose. Its `slug()` makes sentence ids, an id is a file name, and the file
 * it names may long since be sitting on a talker — so its output is frozen and
 * this module's is not. Sharing the table would mean that adding one letter
 * here silently renames files on somebody's device. The same goes for
 * vorlaut's `data/store.ts` `safeName()`, which is an IndexedDB key round-
 * tripped through `.obz` and Sicherung files: a key that spells itself
 * differently is a picture that stops being found.
 *
 * Two tables that look alike and must not be one. The duplication is the
 * cheaper half of that trade, and it is written down in both places.
 */

/** What a letter is spelled as where it cannot be written. mitreden's table,
 *  unchanged. */
const SUBSTITUTE: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', é: 'e', è: 'e',
};

/** The same table for a capital, derived rather than written out a second
 *  time. mitreden lowercases before it looks and a file name keeps the case
 *  somebody typed, so this is the one thing that has to be added to its table
 *  rather than copied from it — and deriving it is how the two cannot drift.
 *
 *  A capital spells into `Oe` and not `OE`: one letter is capital, and the
 *  letter it opens out into is not the start of a second word. */
const spelled = (ch: string): string => {
  const direct = SUBSTITUTE[ch];
  if (direct) return direct;
  const lower = SUBSTITUTE[ch.toLowerCase()];
  return lower ? lower[0]!.toUpperCase() + lower.slice(1) : ch;
};

/**
 * A Sammlung's name as the stem of the file it is downloaded as.
 *
 * Spelled first, then swept — so everything the table has no letter for still
 * becomes `_`, and a name in a script this table has never heard of is no
 * worse off than it was. The two steps are in that order for the obvious
 * reason and it is worth saying anyway: swept first, there is nothing left to
 * spell.
 *
 * `fallback` is answered only for a name that is empty, which after the sweep
 * means an input that was empty to begin with — a run of anything else comes
 * out as `_`. It is optional because the three products do not agree about
 * whose question it is: mitreden and bildhaft answer it here (`sammlung`,
 * `export`), and vorlaut deliberately does not, because every caller there has
 * already been through `nameOf()`, which answers `ui.collection_unnamed` *in
 * the language the page is in*. A fallback forced on that caller would be a
 * second answer to a settled question, and the one that won would be the one
 * written in no language at all.
 */
export const downloadSlug = (name: string, fallback = ''): string =>
  [...name].map(spelled).join('').replace(/[^\w.-]+/g, '_') || fallback;
