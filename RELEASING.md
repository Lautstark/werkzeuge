# Releasing

**Since 2026-09-16 the release is cut by CI, from the commit subjects.**
Nobody runs `npm version` any more and nobody writes a tag. There is still
no registry: a **git tag is the release**, consumers pin
`github:Lautstark/werkzeuge#vX.Y.Z` as they always have, npm runs this package's
`prepare` on their machine, and Renovate moves the pin when a new tag
appears. The tag is still the thing that must never move. What changed is
who cuts it.

## What happens on a push to main

`.github/workflows/release.yml` calls the family's reusable workflow in
`Lautstark/.github`, which runs the gate — `npm run typecheck && npm test && npm run build` — and then
`semantic-release`, configured in `release.config.mjs`.

semantic-release reads every commit since the last `v*` tag and decides:

| subjects since the last tag contain | bump |
|---|---|
| `feat!:`, or a `BREAKING CHANGE:` trailer | **major** |
| `feat:` | **minor** |
| `fix:`, `perf:` | **patch** |
| only `docs:`, `test:`, `ci:`, `build:`, `chore:`, `refactor:` | none — green, nothing tagged |

If there is a bump, it writes the version into `package.json` and the
lockfile's mirror of it, prepends the notes to `CHANGELOG.md`, commits the
three as `chore(release): x.y.z`, tags that commit `vx.y.z`, and writes a
GitHub release with the same notes. Then it checks that the tag on the commit
and `package.json` are one number — the check the old tag-triggered CI made,
asked of the commit it just tagged.

**So the bump is decided when the commit is written, not when the release is
cut.** The commit subject is the release note and the version at once, which
is why `commit-messages.yml` refuses a subject without a prefix. The notes go
in the commit body, where the tag annotation used to carry them.

## Which prefix

Consumers pin this package by tag, and Renovate merges a minor or a patch
into them on its own once their tests pass; a major waits for a
person. The number is a resolver input again, so the prefix has to be honest.

- **`fix:`** — a fix with no API change.
- **`feat:`** — new exports, new optional options.
- **`feat!:`** — anything a consumer must change code for. Put the reason in
  a `BREAKING CHANGE:` trailer; it becomes the first paragraph of the note.

**A change to what `downloadSlug` answers is a major**, whatever the diff size.
It is the name a person sees on a file they have been given, and it is the one
thing here whose output somebody could be relying on twice: once in their
Downloads folder and once in a test asserting a filename. A new letter in the
transliteration table is exactly this case and it does not look like it.

**A change to the revoke delay in `./download` is a major too.** Shortening it
cannot be tested for in a consumer — the failure it risks is a download that
silently does not start, on a machine slower than the one that made the change.

## Never move a published tag

If a tag is wrong, cut the next version: a `fix:` commit. Re-pointing `v1.1.0`
leaves consumers with lockfiles pinned to a commit that no longer matches the
tag, and nothing warns them.
