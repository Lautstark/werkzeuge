import { describe, expect, it } from 'vitest';
import { downloadSlug } from '../src/filename.js';

/*
 * The table this module inherited, asserted here so that the three products
 * can stop asserting it separately.
 *
 * vorlaut's tests/unit/download_name.test.ts wrote this list out rather than
 * importing it, and said why: "so that the day the three products share one
 * implementation, this is the list the shared one has to satisfy". This is
 * that day, and this is that list. What stays in vorlaut is the half that is
 * about vorlaut — that its store key's rule is still a different rule.
 *
 * German is the data here rather than the prose, the line the family already
 * draws between the two: the words below are input to a transliteration, and a
 * test making the point with ASCII stand-ins would not be making it.
 */

/** mitreden's table, plus the capitals it has no use for — it lowercases first
 *  and a file name keeps the case somebody typed. */
const SPELLED: [string, string][] = [
  ['ä', 'ae'], ['ö', 'oe'], ['ü', 'ue'], ['ß', 'ss'],
  ['Ä', 'Ae'], ['Ö', 'Oe'], ['Ü', 'Ue'],
  ['é', 'e'], ['è', 'e'],
];

describe('the name a download arrives under', () => {
  it('spells the German letters out', () => {
    for (const [letter, spelling] of SPELLED) {
      expect(downloadSlug(letter), letter).toBe(spelling);
    }
  });

  it('names the Sammlung this was reported about', () => {
    // The trailing `_` is the closing bracket, and it is left alone: what was
    // being fixed is the holes in the words, not every wart in the name.
    expect(downloadSlug('MetaTalkDE 3x5 (häufige Wörter)'))
      .toBe('MetaTalkDE_3x5_haeufige_Woerter_');
  });

  it('keeps two names apart that a mapping rule runs together', () => {
    // `_` is one answer for every letter it does not know, so two Sammlungen a
    // person would never confuse arrive as one file name. This is the reason
    // the rule is spelling and not a wider allowed set.
    expect(downloadSlug('Füße')).toBe('Fuesse');
    expect(downloadSlug('Füße')).not.toBe(downloadSlug('Fäße'));
  });

  it('keeps the case and the separator a person typed', () => {
    // Not mitreden's shape: it lowercases, joins on `-` and cuts to six words,
    // because its slugs are ids a talker may already hold. These are file
    // names on somebody's disk.
    expect(downloadSlug('Erste Wörter Für Den Morgen Und Den Abend'))
      .toBe('Erste_Woerter_Fuer_Den_Morgen_Und_Den_Abend');
  });

  it('leaves alone what needs nothing done to it', () => {
    for (const name of ['Kueche', 'board-1.obz', '3x5', 'a_b.c-d']) {
      expect(downloadSlug(name), name).toBe(name);
    }
  });

  it('still maps what it has no letter for', () => {
    // The table is German and a name is whatever somebody types. Everything
    // outside it falls through to `_` rather than to a guess, and a run of
    // them is one `_`.
    expect(downloadSlug('Ĳsselmeer')).toBe('_sselmeer');
    expect(downloadSlug('a/b\\c')).toBe('a_b_c');
    expect(downloadSlug('  ')).toBe('_');
  });
});

describe('the fallback, which is the caller\'s question', () => {
  it('is not answered unless one was offered', () => {
    // vorlaut's callers have already been through nameOf(), in the language
    // the page is in. An answer here would be a second one, written in no
    // language at all.
    expect(downloadSlug('')).toBe('');
  });

  it('answers only for a name with nothing in it', () => {
    expect(downloadSlug('', 'sammlung')).toBe('sammlung');
    // Not for one that swept down to `_`: that is a name, and mitreden's old
    // rule — which stripped rather than mapped — is the only reason this ever
    // looked like the same case.
    expect(downloadSlug('!!!', 'sammlung')).toBe('_');
  });
});
