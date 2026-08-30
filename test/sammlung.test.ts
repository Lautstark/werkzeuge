/* What a shelf link will and will not fetch.
 *
 * The id check is why this module is shared rather than copied. Every case
 * below is one that must never reach the network: a name climbing out of the
 * path, an absolute address, a slash hidden inside an id, capitals no id has.
 * A regex nobody tests is a regex somebody relaxes.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { wanted } from "../src/sammlung.js";

/** An address carrying the given parameter, and somewhere to record what the
 *  module asked to be forgotten. */
let forgotten: URL | null = null;
const forget = (url: URL) => { forgotten = url; };

function at(sammlung: string | null): string {
  const url = new URL("https://editor.lautstark.tech/");
  if (sammlung !== null) url.searchParams.set("sammlung", sammlung);
  return url.href;
}

describe("a Sammlung the address names", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    forgotten = null;
  });

  it("wants nothing when the address names nothing", async () => {
    const fetching = vi.spyOn(globalThis, "fetch");
    expect(await wanted(at(null), forget)).toEqual({ kind: "none" });
    expect(fetching).not.toHaveBeenCalled();
    expect(forgotten).toBeNull();
  });

  it.each([
    ["../../etc/passwd", "climbing out of the path"],
    ["https://example.invalid/board.json", "an absolute address"],
    ["a/b", "a slash hidden inside an id"],
    ["Erste-Woerter", "capitals, which no id has"],
    ["erste_woerter", "an underscore, which no id has"],
    ["-fuehrend", "a leading hyphen"],
  ])("never fetches %j — %s", async (id) => {
    const fetching = vi.spyOn(globalThis, "fetch");
    expect(await wanted(at(id), forget)).toEqual({ kind: "unknown", id });
    expect(fetching).not.toHaveBeenCalled();
  });

  it("asks the shelf for a well-formed id, and only the shelf", async () => {
    const fetching = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"sentences":[]}', { status: 200 }));

    const answer = await wanted(at("erste-woerter"), forget);

    expect(String(fetching.mock.calls[0]![0]))
      .toBe("https://lautstark.tech/sammlungen/download/erste-woerter.json");
    expect(answer.kind).toBe("file");
    if (answer.kind !== "file") throw new Error("unreachable");
    expect(answer.file.name).toBe("erste-woerter.json");
    expect(await answer.file.text()).toBe('{"sentences":[]}');
  });

  it("reads a retired entry as unknown rather than as a status code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 404 }));
    expect(await wanted(at("weg-damit"), forget)).toEqual({ kind: "unknown", id: "weg-damit" });
  });

  it("tells a shelf it could not reach apart from one that answered badly", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    const down = await wanted(at("erste-woerter"), forget);
    expect(down.kind).toBe("offline");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));
    const broken = await wanted(at("erste-woerter"), forget);
    expect(broken.kind).toBe("offline");
    if (broken.kind !== "offline") throw new Error("unreachable");
    expect(broken.error.message).toBe("HTTP 503");
  });

  /* A reload must be a reload, not a second copy of a Sammlung somebody has
   * since edited — so the parameter goes before the fetch, not after it. */
  it("forgets the parameter before it does anything with it", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      expect(forgotten, "forgotten before the fetch").not.toBeNull();
      return new Response("{}", { status: 200 });
    });

    await wanted(at("erste-woerter"), forget);

    expect(forgotten!.searchParams.has("sammlung")).toBe(false);
    expect(forgotten!.href).toBe("https://editor.lautstark.tech/");
  });

  it("leaves the rest of the address alone", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await wanted("https://editor.lautstark.tech/?sammlung=x-y&spur=post#dort", forget);
    expect(forgotten!.href).toBe("https://editor.lautstark.tech/?spur=post#dort");
  });
});
