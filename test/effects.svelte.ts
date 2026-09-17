/// <reference types="svelte" />

/**
 * A component, minus the component.
 *
 * `$effect` is what a template is: something that reads, and is asked to read
 * again when what it read has moved. Outside one it needs a root to live in,
 * and `$effect.root` is that — so this is the smallest honest stand-in for the
 * `{t("…")}` the module exists for, and it can count its own re-runs, which a
 * template cannot.
 *
 * It lives in its own `.svelte.ts` rather than in the test file so that the
 * transform in `vitest.config.ts` can keep the one filename rule the products
 * use — `*.svelte.ts` is a rune module, everything else is not.
 */

/** Read something, and count how many times reading it has been asked for. */
export function watching(read: () => unknown): { runs: () => number; stop: () => void } {
  let runs = 0;
  const stop = $effect.root(() => {
    $effect(() => {
      read();
      runs += 1;
    });
  });
  return { runs: () => runs, stop };
}
