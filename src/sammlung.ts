/**
 * A Sammlung the address names, fetched off the shelf.
 *
 *     …/?sammlung=erste-woerter
 *
 * The shelf is <https://lautstark.tech/sammlungen/>, and a link on it lands
 * somebody in a product with the Sammlung already open instead of: download a
 * file, find it again, open the settings, press einlesen. vorlaut had this
 * first; mitreden and bildhaft want the same door, and the half worth sharing
 * is the half where being wrong matters.
 *
 * ## The address carries an id, never a URL
 *
 * `?von=https://…` would be fewer lines and is the version not to write. It
 * turns a link into "fetch whatever this says and import it", and what gets
 * imported is a Sammlung a child then reads. With an id there is one host it
 * can come from, {@link ID} is the whole attack surface, and the worst a
 * crafted link achieves is naming an entry that is not there.
 *
 * That is the reason this is a package rather than three copies. Not the lines
 * — there are barely thirty — but that a regex nobody tests is a regex somebody
 * relaxes when they need one more character through it, in whichever of three
 * repositories they happen to be standing in.
 *
 * ## What it does not do
 *
 * Import anything. It hands back a `File`, and what a product does with one is
 * the product's own business: vorlaut makes a Sammlung of it, mitreden reads
 * sentences out of it, and neither wants the other's idea of what happened.
 * The wording is theirs too — this module has no language.
 */

/** Where the published Sammlungen live. Not a parameter: a caller able to
 *  choose the host is the hole the id exists to close. */
const SHELF = "https://lautstark.tech/sammlungen/download";

/** The shape the shelf gives an entry — lower-case words joined by hyphens,
 *  which is what its own check enforces on a folder name. */
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The parameter a link uses. */
const KEY = "sammlung";

/** What the address turned out to want. */
export type Wanted =
  /** No `?sammlung=` in the address. Nothing to do, and nothing to say. */
  | { kind: "none" }
  /** A link naming something the shelf does not have, or an id no shelf would
   *  ever mint. Both are one sentence to a reader, and neither is an error. */
  | { kind: "unknown"; id: string }
  /** The shelf could not be reached. Distinguished from the above because
   *  "try again later" and "this is gone" are different things to be told. */
  | { kind: "offline"; id: string; error: Error }
  /** The file, named as the person would have seen it had they downloaded it
   *  themselves — which is what a product falls back to for the Sammlung's
   *  name where the file carries none. */
  | { kind: "file"; id: string; file: File };

/** Takes the parameter out of the address bar, leaving the history alone. */
const forgetHere = (url: URL): void => window.history.replaceState(null, "", url);

/**
 * Reads the address and, where it names one, fetches that Sammlung.
 *
 * Never rejects: a shelf that cannot be reached is a message, not a broken
 * page, and every caller runs this somewhere a rejection would be read as the
 * page having failed to load.
 *
 * `here` and `forget` are arguments with the live ones as defaults rather than
 * two reaches for `window` inside — which is what lets {@link ID} be tested
 * without a DOM, in packages and products whose unit tests run in node.
 *
 * The parameter leaves the address before the fetch, so a reload is a reload
 * and not a second copy of a Sammlung somebody has since edited.
 */
export async function wanted(
  here: string = window.location.href,
  forget: (url: URL) => void = forgetHere,
): Promise<Wanted> {
  const address = new URL(here);
  const id = address.searchParams.get(KEY);
  if (!id) return { kind: "none" };

  address.searchParams.delete(KEY);
  forget(address);

  if (!ID.test(id)) return { kind: "unknown", id };

  try {
    const answer = await fetch(`${SHELF}/${id}.json`);
    // 404 is the ordinary case — an entry renamed or retired — and it deserves
    // the same sentence as a malformed id rather than a status code.
    if (answer.status === 404) return { kind: "unknown", id };
    if (!answer.ok) {
      return { kind: "offline", id, error: new Error(`HTTP ${answer.status}`) };
    }
    const file = new File([await answer.blob()], `${id}.json`, { type: "application/json" });
    return { kind: "file", id, file };
  } catch (error) {
    return { kind: "offline", id, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
