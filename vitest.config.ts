import { compileModule } from 'svelte/compiler';
import { defineConfig } from 'vitest/config';

/**
 * Runes, for the one module that ships as source.
 *
 * `src/reactive-text.svelte.ts` is a compiler form, not JavaScript: `$state(0)`
 * is a call to an identifier nothing defines, and importing the file untouched
 * throws a ReferenceError before a single assertion runs.
 *
 * Twelve lines rather than `@sveltejs/vite-plugin-svelte`, which is more than
 * is wanted here — the plugin exists to compile components and there is not a
 * component in this package — and which is also the tool mitreden cannot use:
 * it declares an `optimizeDeps` set, which turns vitest's dependency optimizer
 * on. This is mitreden's copy, and that is deliberate. A consumer reading the
 * module's header is told to write these lines, so the package had better be
 * the proof that they are enough.
 *
 * `post`, so that Vite has already taken the TypeScript out: `compileModule`
 * reads JavaScript, and these files are `.svelte.ts`.
 */
const runes = {
  name: 'werkzeuge:runes',
  enforce: 'post' as const,
  transform(code: string, id: string) {
    if (!/\.svelte\.[jt]s($|\?)/.test(id)) return null;
    const made = compileModule(code, { filename: id, dev: false });
    return { code: made.js.code, map: made.js.map };
  },
};

/*
 * happy-dom, because ./download is about the DOM and nothing else: an anchor
 * that has to be in the document, a click on it, and a blob URL let go of
 * afterwards. Under `node` there is no `document` to put the anchor into, and
 * the two things this module exists to get right — that the node is appended
 * and removed, and that the URL outlives the click — are exactly the two that
 * cannot be asserted without one.
 *
 * The other modules need no environment at all. They run in this one because a
 * second config would be a second thing to keep in step, and they are
 * indifferent.
 *
 * `conditions: ['browser']` is the one thing the rune test needs from
 * resolution: without it vitest takes svelte's `server` export, and `flushSync`
 * and `$effect.root` are not available there. The failure names a lifecycle
 * function and says nothing about configuration.
 */
export default defineConfig({
  plugins: [runes],
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'happy-dom',
    restoreMocks: true,
    unstubGlobals: true,
  },
});
