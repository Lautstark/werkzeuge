import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MoreMenu from '../svelte/MoreMenu.svelte';

/* The component's own `MenuRow`; tsc cannot see a `.svelte` module's exports. */
type MenuRow =
  | { label: string; note?: string; danger?: boolean; checked?: boolean; run: () => void }
  | 'rule';

let host: HTMLElement;
let made: Record<string, unknown> | null = null;

function show(rows: () => MenuRow[], props: Record<string, unknown> = {}): HTMLButtonElement {
  host = document.createElement('div');
  document.body.append(host);
  made = mount(MoreMenu, { target: host, props: { rows, label: 'Mehr', ...props } });
  flushSync();
  return host.querySelector('button')!;
}

async function opened(trigger: HTMLButtonElement): Promise<HTMLElement> {
  trigger.click();
  flushSync();
  await new Promise((done) => setTimeout(done, 0));
  flushSync();
  return host.querySelector('.menu')!;
}

afterEach(() => {
  if (made) unmount(made);
  made = null;
  host?.remove();
});

describe('MoreMenu', () => {
  it('emits the vocabulary components.css draws', async () => {
    const trigger = show(() => [
      { label: 'Anderen Ordner wählen …', run: () => {} },
      'rule',
      { label: 'Farbig', checked: true, run: () => {} },
      { label: 'Schwarz-weiß', checked: false, run: () => {} },
      'rule',
      { label: 'Ordner vergessen', note: 'Danach gilt ARASAAC.', danger: true, run: () => {} },
    ]);
    expect(trigger.closest('.menu-anchor')).not.toBeNull();
    expect(trigger.getAttribute('aria-label')).toBe('Mehr');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const menu = await opened(trigger);
    expect(menu.getAttribute('role')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const rows = [...menu.querySelectorAll('button')];
    expect(rows.map((row) => row.getAttribute('role')))
      .toEqual(['menuitem', 'menuitemradio', 'menuitemradio', 'menuitem']);
    expect(rows[1]!.getAttribute('aria-checked')).toBe('true');
    expect(rows[2]!.getAttribute('aria-checked')).toBe('false');
    expect(rows[0]!.hasAttribute('aria-checked')).toBe(false);
    expect(rows[3]!.classList.contains('danger')).toBe(true);
    expect(rows[3]!.querySelector('.menu__note')?.textContent).toBe('Danach gilt ARASAAC.');
    expect(menu.querySelectorAll('hr')).toHaveLength(2);
  });

  it('closes and runs the row in the same click', async () => {
    const run = vi.fn();
    const menu = await opened(show(() => [{ label: 'Los', run }]));
    menu.querySelector('button')!.click();
    flushSync();
    expect(run).toHaveBeenCalledOnce();
    expect(host.querySelector('.menu')).toBeNull();
  });

  it('moves focus to the first row and hands it back on Escape', async () => {
    const trigger = show(() => [{ label: 'Eins', run: () => {} }, { label: 'Zwei', run: () => {} }]);
    const menu = await opened(trigger);
    const [one, two] = [...menu.querySelectorAll('button')];
    expect(document.activeElement).toBe(one);
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(two);
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(host.querySelector('.menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a press anywhere else', async () => {
    await opened(show(() => [{ label: 'Eins', run: () => {} }]));
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    flushSync();
    expect(host.querySelector('.menu')).toBeNull();
  });

  it('disables every row while the host is working', async () => {
    const menu = await opened(show(() => [{ label: 'Eins', run: () => {} }], { disabled: true }));
    expect(menu.querySelector('button')!.disabled).toBe(true);
  });
});
