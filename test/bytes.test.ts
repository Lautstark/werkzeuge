import { describe, expect, it } from 'vitest';
import { weighs } from '../src/bytes.js';

describe('a size somebody glances at', () => {
  it('is whole megabytes', () => {
    expect(weighs(1_500_000)).toBe('2 MB');
    expect(weighs(63_400_000)).toBe('63 MB');
  });

  it('is megabytes and not mebibytes', () => {
    // 1e6, the number printed on everything a person compares this against.
    expect(weighs(1_048_576)).toBe('1 MB');
  });

  it('says 0 MB rather than nothing for something too small to see', () => {
    // A package of one board is tens of kilobytes. "0 MB" is honest and the
    // caller can say something else if it wants to; an empty string here would
    // be this module deciding that for it.
    expect(weighs(0)).toBe('0 MB');
    expect(weighs(40_000)).toBe('0 MB');
  });
});
