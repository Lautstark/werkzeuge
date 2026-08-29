import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { download, downloadJson } from '../src/download.js';

/*
 * The two things six copies disagreed about, and one thing they agreed on.
 *
 * Neither of the first two is visible in a product's own tests: an anchor that
 * is never removed is a leak nothing measures, and a URL revoked too early is
 * a download that silently does not happen. Both are asserted here because
 * here is the only place they can be.
 */

/** What the browser was told, without a browser: happy-dom has no download
 *  manager, so the anchor's own state at the moment of the click is the whole
 *  of the observable behaviour. Recorded during the event rather than read
 *  afterwards, because the node is removed a line later. */
interface Clicked { href: string; name: string; connected: boolean }

function watchClicks(): Clicked[] {
  const seen: Clicked[] = [];
  document.addEventListener('click', (event) => {
    const link = event.target as HTMLAnchorElement;
    seen.push({ href: link.href, name: link.download, connected: link.isConnected });
  }, true);
  return seen;
}

let revoked: string[] = [];
let created: string[] = [];
const real = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

/* The real URL object with two methods swapped, rather than a stand-in for the
 * whole of it: happy-dom builds a URL of its own when an anchor is clicked, and
 * replacing the constructor breaks that a layer below anything under test.
 *
 * The click is also stopped from navigating. happy-dom answers a click on an
 * anchor by trying to open its href, which a `blob:` URL nothing served cannot
 * be — and the browser's own handling of the click is not what these tests are
 * about. What they are about is the state of the anchor at the moment the
 * click leaves it, which the capture phase sees first. */
beforeEach(() => {
  vi.useFakeTimers();
  revoked = [];
  created = [];
  let n = 0;
  URL.createObjectURL = () => {
    const url = `blob:test/${n++}`;
    created.push(url);
    return url;
  };
  URL.revokeObjectURL = (url: string) => { revoked.push(url); };
  document.addEventListener('click', stopNavigation, true);
});

const stopNavigation = (event: Event): void => { event.preventDefault(); };

afterEach(() => {
  vi.useRealTimers();
  document.removeEventListener('click', stopNavigation, true);
  document.body.replaceChildren();
  URL.createObjectURL = real.create;
  URL.revokeObjectURL = real.revoke;
});

describe('the anchor', () => {
  it('is in the document when it is clicked, and gone afterwards', () => {
    const clicked = watchClicks();
    download(new Blob(['x']), 'eins.txt');

    // vorlaut never appended, which is why it also never removed.
    expect(clicked[0]!.connected).toBe(true);
    expect(document.body.querySelector('a')).toBeNull();
  });

  it('leaves nothing behind after ten downloads', () => {
    for (let i = 0; i < 10; i++) download(new Blob(['x']), `datei-${i}.txt`);
    expect(document.body.children.length).toBe(0);
  });

  it('is told the filename exactly as it was given', () => {
    const clicked = watchClicks();
    // Composed by the caller, stamp and all: this module adds nothing.
    download(new Blob(['x']), 'MetaTalkDE_3x5-device.obz');
    expect(clicked[0]!.name).toBe('MetaTalkDE_3x5-device.obz');
  });
});

describe('the blob URL', () => {
  it('is still alive when the click returns', () => {
    download(new Blob(['x']), 'eins.txt');
    // bildhaft's copy revoked here. This is the assertion that says why not.
    expect(revoked).toEqual([]);
  });

  it('survives a couple of seconds, which mitreden did not assume', () => {
    download(new Blob(['x']), 'eins.txt');
    vi.advanceTimersByTime(2_000);
    expect(revoked).toEqual([]);
  });

  it('is let go of a minute later', () => {
    download(new Blob(['x']), 'eins.txt');
    vi.advanceTimersByTime(60_000);
    expect(revoked).toEqual(created);
  });

  it('lets go of each download separately', () => {
    download(new Blob(['a']), 'a.txt');
    vi.advanceTimersByTime(30_000);
    download(new Blob(['b']), 'b.txt');

    vi.advanceTimersByTime(30_000);
    expect(revoked).toEqual([created[0]]);

    vi.advanceTimersByTime(30_000);
    expect(revoked).toEqual(created);
  });
});

describe('the JSON door', () => {
  it('writes the file a person opens: two spaces, no trailing anything', async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = (blob: Blob | MediaSource) => { blobs.push(blob as Blob); return 'blob:test/json'; };

    downloadJson({ collection: 'Häufige Wörter', items: [1, 2] }, 'x.json');

    expect(blobs[0]!.type).toBe('application/json');
    expect(await blobs[0]!.text()).toBe(
      '{\n  "collection": "Häufige Wörter",\n  "items": [\n    1,\n    2\n  ]\n}',
    );
  });
});
