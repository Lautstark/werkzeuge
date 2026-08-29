# Releasing

There is no registry publish. A **git tag is the release** — consumers resolve
`github:Lautstark/werkzeuge#v1.0.0` against the tags in this repo, so pushing a
tag is the moment a version becomes real for bildhaft, mitreden and vorlaut.
Treat it as publishing, because it is.

## Every release

From a clean `main`:

```
npm version minor
```

`preversion` runs typecheck, tests and the build first, so a broken tree cannot
be tagged. Nothing has left your machine yet — check `git show --stat HEAD`,
then `git push --follow-tags`. The push is deliberately separate: a pushed tag
can be resolved by a consumer within seconds and must never be moved
afterwards, so the irreversible half is its own command.

## Which bump

The three products pin by exact tag, so a bump reaches nobody until a consumer
changes its `package.json`. That makes the number documentation rather than a
resolver input — which is a reason to keep it honest, not a reason to relax.

- **patch** — a fix with no API change.
- **minor** — new exports, new optional options.
- **major** — anything a consumer must change code for.

**A change to what `downloadSlug` answers is a major**, whatever the diff size.
It is the name a person sees on a file they have been given, and it is the one
thing here whose output somebody could be relying on twice: once in their
Downloads folder and once in a test asserting a filename. A new letter in the
transliteration table is exactly this case and it does not look like it.

**A change to the revoke delay in `./download` is a major too.** Shortening it
cannot be tested for in a consumer — the failure it risks is a download that
silently does not start, on a machine slower than the one that made the change.

## Never move a published tag

If a tag is wrong, cut the next version. Re-pointing `v1.1.0` leaves consumers
with lockfiles pinned to a commit that no longer matches the tag, and nothing
warns them.
