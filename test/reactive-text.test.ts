import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { reactiveText } from '../src/reactive-text.svelte.js';
import { watching } from './effects.svelte.js';

/**
 * The two halves of the claim: a drawing reader is asked again when the words
 * move, and is not asked when they have not. The second is the one worth a
 * test — a dependency that fires on everything looks exactly like this one
 * from the outside until the page is slow.
 */

/** A table behind a live binding, which is what both products actually have:
 *  vorlaut reassigns `TEXTS`, mitreden writes its `Lang` and the lookup reads
 *  it. Neither is reactive, and that is the point — the rune is. */
let table: Record<string, string> = { greeting: 'Guten Tag', count_one: 'ein Bild', count_other: '{n} Bilder' };

const plain = {
  t: (key: string): string => table[key] ?? key,
  tn: (stem: string, n: number): string => (table[n === 1 ? `${stem}_one` : `${stem}_other`] ?? stem).replace('{n}', String(n)),
};

describe('reactiveText', () => {
  it('hands back the same lookups, answering the same words', () => {
    const words = reactiveText(plain);

    expect(words.t('greeting')).toBe('Guten Tag');
    expect(words.tn('count', 1)).toBe('ein Bild');
    expect(words.tn('count', 4)).toBe('4 Bilder');
  });

  it('asks a reader again when the words moved', () => {
    const words = reactiveText(plain);
    const seen: string[] = [];
    const drawn = watching(() => seen.push(words.t('greeting')));
    flushSync();
    expect(drawn.runs()).toBe(1);

    table = { ...table, greeting: 'Good day' };
    words.moved();
    flushSync();

    expect(drawn.runs()).toBe(2);
    expect(seen).toEqual(['Guten Tag', 'Good day']);
    drawn.stop();
  });

  it('does not ask a reader again when they have not', () => {
    const words = reactiveText(plain);
    const drawn = watching(() => words.t('greeting'));
    flushSync();

    words.t('greeting');
    words.tn('count', 2);
    flushSync();

    expect(drawn.runs()).toBe(1);
    drawn.stop();
  });

  it('shares one rune across the whole record, so one writer is enough', () => {
    // The reason the factory takes a record rather than a lookup: mitreden's
    // `tn` is not typed over `Key` and cannot share `t`'s generic, but its
    // `setLang` is one call and must not have to bump two runes.
    const words = reactiveText(plain);
    const plural = watching(() => words.tn('count', 3));
    flushSync();

    words.moved();
    flushSync();

    expect(plural.runs()).toBe(2);
    plural.stop();
  });

  it('is readable, for a lookup that has to stay in the product', () => {
    // §6.11: mitreden's plural lookup needs `void <rune>` in its own body, so
    // a bump-only function cannot work. This is that call site.
    const words = reactiveText(plain);
    const ours = (name: string): string => {
      void words.touched();
      return `${name}: ${table['greeting']}`;
    };
    const drawn = watching(() => ours('Sprache'));
    flushSync();

    words.moved();
    flushSync();

    expect(drawn.runs()).toBe(2);
    drawn.stop();
  });

  it('gives two calls two runes', () => {
    // ./changed's argument, unchanged: the shape is shared, not the instance.
    const words = reactiveText(plain);
    const others = reactiveText(plain);
    const drawn = watching(() => others.t('greeting'));
    flushSync();

    words.moved();
    flushSync();

    expect(drawn.runs()).toBe(1);
    drawn.stop();
  });

  it('refuses a lookup wearing the rune\'s name', () => {
    expect(() => reactiveText({ t: plain.t, touched: () => 'nope' })).toThrow(/touched/);
    expect(() => reactiveText({ t: plain.t, moved: () => 'nope' })).toThrow(/moved/);
  });
});
