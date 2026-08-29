/**
 * A size, in the one unit anybody reads it in.
 *
 * Three copies, all of them the same expression: mitreden's voice picker,
 * vorlaut's voice picker, and vorlaut's package export — whose own comment
 * already noted that the other one rounds the same way and asked to be
 * believed about it. This is that comment turned into an import.
 *
 * Not in bildhaft, which downloads no models and packages no files.
 */

/**
 * `1_500_000` → `2 MB`.
 *
 * Megabytes and not mebibytes, and rounded to a whole one. This is a number
 * somebody glances at to see that a voice is the size a voice should be, or
 * that a package is not empty — not one they do arithmetic with. A voice model
 * is tens of megabytes and a package is single digits, so the first decimal
 * place would be noise in both, and `1e6` is the number printed on everything
 * else a person compares this against.
 */
export const weighs = (bytes: number): string => `${Math.round(bytes / 1e6)} MB`;
