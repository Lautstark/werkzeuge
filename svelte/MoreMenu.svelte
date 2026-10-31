<script lang="ts" module>
  /**
   * One row of the menu. `'rule'` draws the `hr` between groups.
   *
   * `checked` turns the row into a `menuitemradio`: a group of rows that each
   * set one value, where exactly one is in force. Leave it `undefined` on every
   * row that is a command.
   */
  export type MenuRow =
    | { label: string; note?: string; danger?: boolean; checked?: boolean; run: () => void }
    | 'rule';
</script>

<script lang="ts">
  /**
   * The `⋯` in the corner of a box, and the menu it opens.
   *
   * conventions.md §6.0 keeps a provider package from importing
   * `@lautstark/design/svelte/Overflow`, so sicherung drew this menu itself in
   * `DatenPanel`, and the Symbole and Stimme panels in bildquelle and
   * stimmquelle would have drawn it twice more. werkzeuge is the place all
   * three may import: it depends on nothing in the family.
   *
   * It emits design's vocabulary and imports none of it:
   * `.menu-anchor > .menu[role=menu] > button[role=menuitem]`, `hr`, `.danger`,
   * `.menu__note`, `role=menuitemradio` with `aria-checked`, and
   * `.menu-anchor--up` when it opens upward. components.css draws all of them.
   *
   * ## The keyboard contract is components.css's
   *
   * Opening moves focus to the first enabled row; the arrows and Home/End walk
   * the rows; Escape closes and hands focus back to the trigger; Tab closes and
   * lets focus move on. A press anywhere else closes it.
   *
   * ## A row runs inside the click
   *
   * Rows that open a file or directory picker are refused without a user
   * gesture, so a row closes the menu and calls `run` in the same handler,
   * before any await.
   *
   * ## Where it opens
   *
   * Upward when there is more room above, with the height capped so the list
   * stays inside the nearest box that scrolls. Not `closest('.body')`, which is
   * what `@lautstark/design/svelte/fit.js` measures against: inside a settings
   * sheet the first `.body` up is the Panel's own, as tall as the block it
   * holds, and the menu would be cut off either way.
   */
  import { tick } from 'svelte';

  let {
    rows,
    label,
    disabled = false,
    start = false,
  }: {
    /** Read each time the menu opens, so the rows can follow the state. */
    rows: () => MenuRow[];
    /** The trigger's accessible name and tooltip, e.g. „Mehr". */
    label: string;
    /** Every row is disabled, e.g. while a press is still working. */
    disabled?: boolean;
    /** Hang the list off the left edge of the trigger instead of the right. */
    start?: boolean;
  } = $props();

  let open = $state(false);
  let up = $state(false);
  let cap = $state<number | null>(null);
  let trigger = $state<HTMLButtonElement>();
  let list = $state<HTMLDivElement>();

  const items = (): HTMLButtonElement[] =>
    [...(list?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];

  async function toggle(): Promise<void> {
    open = !open;
    if (!open) return;
    await tick();
    fit();
    items()[0]?.focus({ preventScroll: true });
  }

  function fit(): void {
    if (!list || !trigger) return;
    let box: HTMLElement | null = trigger.parentElement;
    while (box && !/auto|scroll/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
    const view = box ? box.getBoundingClientRect()
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const at = trigger.getBoundingClientRect();
    const below = view.bottom - at.bottom - 12;
    const above = at.top - view.top - 12;
    up = list.offsetHeight > below && above > below;
    cap = Math.max(96, Math.floor(up ? above : below));
  }

  function close(refocus: boolean): void {
    open = false;
    up = false;
    cap = null;
    if (refocus) trigger?.focus();
  }

  function walk(event: KeyboardEvent): void {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    const go = (to: number) => { event.preventDefault(); all[(to + all.length) % all.length]?.focus(); };
    if (event.key === 'ArrowDown') go(at + 1);
    else if (event.key === 'ArrowUp') go(at - 1);
    else if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(all.length - 1);
    else if (event.key === 'Escape') { event.preventDefault(); close(true); }
    else if (event.key === 'Tab') close(false);
  }

  $effect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!list?.contains(target) && !trigger?.contains(target)) close(false);
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  });
</script>

<span class="menu-anchor{start ? ' start' : ''}{up ? ' menu-anchor--up' : ''}">
  <button bind:this={trigger} type="button" class="btn quiet icon" aria-label={label}
    title={label} aria-haspopup="menu" aria-expanded={open}
    onclick={() => void toggle()}>⋯</button>
  {#if open}
    <div bind:this={list} class="menu" role="menu" tabindex="-1" onkeydown={walk}
      style:max-height={cap === null ? undefined : `${cap}px`} style:overflow-y="auto"
      style:overscroll-behavior="contain">
      {#each rows() as row, at (at)}
        {#if row === 'rule'}<hr />{:else}<button type="button"
          role={row.checked === undefined ? 'menuitem' : 'menuitemradio'}
          aria-checked={row.checked}
          class={row.danger ? 'danger' : undefined} {disabled}
          onclick={() => { close(false); row.run(); }}>{row.label}{#if row.note}<span
            class="menu__note">{row.note}</span>{/if}</button>{/if}
      {/each}
    </div>
  {/if}
</span>
