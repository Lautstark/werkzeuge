# Releasing

**Since 2026-09-16 this package is published to npmjs.org as
`@lautstark/werkzeuge`, prebuilt, by CI, from the commit subjects.** Nobody
runs `npm version` any more and nobody writes a tag. `dist/` is in the tarball
and there is no `prepare` script: a consumer installs compiled output and
compiles nothing.

The `github:Lautstark/werkzeuge#vX.Y.Z` pins still resolve for every tag cut
before that date. No tag cut after it carries a build step, so a consumer that
wants anything newer than v1.2.0 takes it from npm:

```
npm install @lautstark/werkzeuge@^1.3.0
```

A **git tag is still the release**, and it is still the thing that must never
move. What changed is who cuts it.

## What happens on a push to main

`.github/workflows/release.yml` calls the family's reusable workflow in
`Lautstark/.github`, which runs the gate — `npm run typecheck && npm test &&
npm run build` — checks that the tarball `npm pack` would ship carries every
entry point `package.json` declares and no `prepare` script, and then runs
`semantic-release`, configured in `release.config.mjs`.

semantic-release reads every commit since the last `v*` tag and decides:

| subjects since the last tag contain | bump |
|---|---|
| `feat!:`, or a `BREAKING CHANGE:` trailer | **major** |
| `feat:` | **minor** |
| `fix:`, `perf:` | **patch** |
| only `docs:`, `test:`, `ci:`, `build:`, `chore:`, `refactor:` | none — green, nothing published |

If there is a bump, it writes the version into `package.json` and the
lockfile's mirror of it, prepends the notes to `CHANGELOG.md`, commits the
three as `chore(release): x.y.z`, tags that commit `vx.y.z`, publishes the
tarball to npmjs.org with provenance, and writes a GitHub release with the
same notes. Then it checks that the tag on the commit, `package.json` and what
the registry answers for that version are one number — the check the old
tag-triggered CI made, asked of the commit it just tagged.

**So the bump is decided when the commit is written, not when the release is
cut.** The commit subject is the release note and the version at once, which
is why `commit-messages.yml` refuses a subject without a prefix.

## What a person still does, once

The workflow stops before semantic-release, green, with a notice, until the
npm side exists. That side is an account and cannot be created from a
repository: the `lautstark` organisation on npmjs.org, the first publish of
this package by hand (`npm ci && npm run build && npm publish --access
public` from a clean checkout), and then either trusted publishing for
`release.yml` plus a repository variable `NPM_TRUSTED_PUBLISHING=true`, or an
organisation secret `NPM_TOKEN`. `@lautstark/sicherung`'s RELEASING.md spells
the three out; they are the same for every package in the family.

## Which prefix

Consumers take this package as a caret range now, and Renovate merges a minor
or a patch into them on its own once their tests pass; a major waits for a
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
tag, and nothing warns them. Since 2026-09-16 that goes for the npm side too —
a published version cannot be replaced, only deprecated and superseded.
