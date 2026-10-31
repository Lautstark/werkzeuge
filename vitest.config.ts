import { svelte } from '@sveltejs/vite-plugin-svelte';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * The full `svelte()` plugin, since `svelte/MoreMenu.svelte` is a component and
 * its test mounts it. It also compiles `src/reactive-text.svelte.ts`, which is
 * a compiler form rather than JavaScript (`$state(0)` is a call to an
 * identifier nothing defines). Until the menu arrived this was mitreden's
 * twelve-line `compileModule` shim, which was enough for a rune module and
 * cannot compile a component.
 */
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
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: [...configDefaults.exclude, '.claude/**'],
    environment: 'happy-dom',
    restoreMocks: true,
    unstubGlobals: true,
  },
});
