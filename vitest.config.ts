import { defineConfig } from 'vitest/config';

/*
 * happy-dom, because ./download is about the DOM and nothing else: an anchor
 * that has to be in the document, a click on it, and a blob URL let go of
 * afterwards. Under `node` there is no `document` to put the anchor into, and
 * the two things this module exists to get right — that the node is appended
 * and removed, and that the URL outlives the click — are exactly the two that
 * cannot be asserted without one.
 *
 * The other three modules need no environment at all. They run in this one
 * because a second config would be a second thing to keep in step, and they
 * are indifferent.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    restoreMocks: true,
    unstubGlobals: true,
  },
});
