## [2.0.0](https://github.com/Lautstark/werkzeuge/compare/v1.3.0...v2.0.0) (2026-09-18)

### ⚠ BREAKING CHANGES

* `@lautstark/werkzeuge/dom` is gone. No consumer on
2026-09-18 imports it; a product that still does draws with the DOM by hand
and should not, and the answer is a component rather than a re-export.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

### Features

* drop ./dom, whose four callers draw with Svelte components now ([743b710](https://github.com/Lautstark/werkzeuge/commit/743b71022946251f9ab4323804443b396dd7778d))

## [1.3.0](https://github.com/Lautstark/werkzeuge/compare/v1.2.0...v1.3.0) (2026-09-17)

### Features

* a lookup a component can draw from, and be drawn again ([85a987b](https://github.com/Lautstark/werkzeuge/commit/85a987b5f60b0273aa24d91deaf71244604d2e25))
