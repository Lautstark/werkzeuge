/**
 * One notifier, next to the writes.
 *
 * conventions.md §2.2: every write that changes what a Sicherung would contain
 * says so through `touched()`, and the standing backup listens through
 * `onChanged()`. The rule is about *where* the call goes rather than about
 * what it does — the alternative was calling `schedule()` from each place in
 * the interface that edits something, and it fails silently and identically in
 * all three products: somebody adds the thirteenth mutator next year, having
 * never heard of the backup, nothing goes red, and a child's talker quietly
 * stops being saved.
 *
 * Ten lines, and all three products had written them. Three of the four copies
 * were byte-identical; the fourth is bildhaft's `onSymbolReset`, which is the
 * same ten lines under other names for a subject that has nothing to do with
 * backups. That is the argument for a factory rather than a module holding one
 * `Set`: the shape is what is shared, not the instance. A product that wants
 * two of these has two.
 *
 * There is nothing here to get right and nothing here to vary, which is
 * normally an argument against a package. It is in this one because the
 * products were already keeping it in a file of its own for exactly that
 * reason — vorlaut's `data/changed.ts` says a file "makes the day it earns a
 * package a move rather than an excavation" — and this is that day.
 */

/** A place for writes to announce themselves, and for anything that cares to
 *  hear about it. */
export interface Changes {
  /** Listen. The returned function stops listening. */
  onChanged(listener: () => void): () => void;
  /** Something changed. Called by writes, never by the page: a call site in
   *  the interface is the failure this exists against. */
  touched(): void;
}

/**
 * A new, independent notifier.
 *
 * Listeners are held in a `Set`, so subscribing the same function twice is
 * subscribing it once, and they are called in the order they arrived. Nothing
 * is caught: a listener that throws is a listener that is wrong, and swallowing
 * it here would hide it from the only place that could report it.
 */
export function changes(): Changes {
  const watchers = new Set<() => void>();
  return {
    onChanged(listener: () => void): () => void {
      watchers.add(listener);
      return () => { watchers.delete(listener); };
    },
    touched(): void {
      for (const listener of watchers) listener();
    },
  };
}
