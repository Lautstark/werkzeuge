/**
 * Handing a finished file to the browser.
 *
 * Six lines that existed six times: twice in mitreden, once in bildhaft, and
 * three times in vorlaut's shell. The three products agreed about what it
 * does and disagreed about the two things that decide whether it works —
 * whether the anchor goes into the document, and when the blob URL is let go
 * of — which is the arrangement where the copies drift and nobody notices,
 * because a broken download looks like a browser being a browser.
 *
 * ## The anchor is appended, then removed
 *
 * `link.click()` on a detached anchor happens to work in every browser the
 * family supports, and vorlaut's copy relied on it — but it also never removed
 * the node, because there was nothing to remove it from, so a session that
 * exported ten packages left ten detached anchors holding ten blob URLs. Two
 * of the six copies appended and removed; that is the version that is right in
 * both halves, so it is the one here.
 *
 * ## The revoke is late, and 60 seconds is the number
 *
 * bildhaft's copy revoked synchronously, immediately after the click. That is
 * the bug this module was written to delete. `click()` returns before the
 * browser has opened the URL, and a blob revoked in that gap is **a download
 * that silently never begins** — no error, no console line, nothing for the
 * person to retry except the whole export.
 *
 * So the only question is how long. The two products that already revoked late
 * disagreed: mitreden waited 2 seconds, vorlaut 60. The costs are not
 * symmetric, and that decides it:
 *
 *   - too early — the file never arrives, silently, and the export has to be
 *     redone. On a slow machine under a large export, "the gap is short" is an
 *     assumption nothing here can check.
 *   - too late — one blob stays in memory a little longer, on a page that had
 *     to hold that same blob in memory to create it a moment ago.
 *
 * A minute is past any plausible click-to-fetch gap and still bounds the leak
 * to the life of one export. Two seconds is a guess about a machine; sixty is
 * a guess about nothing.
 */

/** How long a blob URL outlives the click that used it. */
const REVOKE_AFTER = 60_000;

/**
 * Offers `blob` to the browser as a download called `filename`.
 *
 * The filename is taken whole and used as it stands. What a product calls its
 * exports — a prefix, a date stamp, an extension — is the product's, and the
 * three do not agree about it: vorlaut composes `<name>-app.zip` and stamps
 * nothing, and the other two stamp everything. See ./filename for the one part
 * of the name that *is* shared, which is what a Sammlung's own name becomes.
 */
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER);
}

/**
 * The same, for something that is a JSON file rather than bytes already.
 *
 * Two spaces, because every export in the family is indented that way and
 * these are files a person opens: a Sicherung is the thing somebody reads when
 * they are trying to work out what happened to their library.
 *
 * A thin door over `download` rather than a second implementation — mitreden
 * and bildhaft both have a JSON-serialising entry and mitreden also has a
 * raw-blob one, so both doors are real and only one of them can be the
 * primitive.
 */
export function downloadJson(data: unknown, filename: string): void {
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}
