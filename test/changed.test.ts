import { describe, expect, it, vi } from 'vitest';
import { changes } from '../src/changed.js';

describe('the change notifier', () => {
  it('tells everybody listening', () => {
    const { onChanged, touched } = changes();
    const heard: string[] = [];
    onChanged(() => heard.push('a'));
    onChanged(() => heard.push('b'));

    touched();

    // In the order they arrived: nothing depends on it, and a Set is what
    // makes it true rather than a promise in a comment.
    expect(heard).toEqual(['a', 'b']);
  });

  it('hands back the way to stop', () => {
    const { onChanged, touched } = changes();
    const heard = vi.fn();
    const stop = onChanged(heard);

    touched();
    stop();
    touched();

    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('counts one listener once, however many times it subscribed', () => {
    const { onChanged, touched } = changes();
    const heard = vi.fn();
    onChanged(heard);
    onChanged(heard);

    touched();

    // The `Set` half of the shape. mitreden's ui/state.ts is the one copy in
    // the family backed by an array, and it is staying there — see
    // conventions.md §5 #7.
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('is a new one every time, so a product may have two', () => {
    // bildhaft has exactly this: one for the library, and one for "a symbol
    // source became usable again", which has nothing to do with backups.
    const library = changes();
    const symbols = changes();
    const heardLibrary = vi.fn();
    const heardSymbols = vi.fn();
    library.onChanged(heardLibrary);
    symbols.onChanged(heardSymbols);

    library.touched();

    expect(heardLibrary).toHaveBeenCalledTimes(1);
    expect(heardSymbols).not.toHaveBeenCalled();
  });

  it('does not swallow a listener that throws', () => {
    const { onChanged, touched } = changes();
    onChanged(() => { throw new Error('the backup could not be scheduled'); });

    // Caught here would be invisible everywhere: the write that called
    // touched() is the only thing with a caller who could report it.
    expect(() => touched()).toThrow('the backup could not be scheduled');
  });
});
