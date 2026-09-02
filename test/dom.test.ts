import { beforeEach, describe, expect, it, vi } from 'vitest';
import { byId, el, fill, svg, toggleClass } from '../src/dom.js';

/*
 * The four rules that were about to be lost by taking one product's copy whole.
 *
 * Everything else here is four copies agreeing, and copies that agree need no
 * assertion. What is asserted is where they disagreed — and in two cases where
 * only one of them was right.
 */

beforeEach(() => { document.body.innerHTML = ''; });

describe('an ARIA state is a word, not a bare attribute', () => {
  /* wochenwerk's rule, and it arrived there from two call sites that had
     silently produced neither state: `aria-checked=""` is not checked, it is
     unreadable, and a radio that is not the answer has to say so out loud. */
  it('writes aria-* booleans out', () => {
    expect(el('div', { attrs: { 'aria-checked': false } }).getAttribute('aria-checked')).toBe('false');
    expect(el('div', { attrs: { 'aria-checked': true } }).getAttribute('aria-checked')).toBe('true');
    expect(el('div', { attrs: { 'aria-pressed': false } }).getAttribute('aria-pressed')).toBe('false');
  });

  /* And the ordinary boolean attributes keep the opposite behaviour, which is
     the whole reason the two cases have to be told apart. */
  it('still writes non-aria booleans bare, and removes them on false', () => {
    expect(el('input', { attrs: { disabled: true } }).getAttribute('disabled')).toBe('');
    expect(el('input', { attrs: { disabled: false } }).hasAttribute('disabled')).toBe(false);
  });
});

describe('custom properties go through setProperty', () => {
  /* Assigning them onto the style object does nothing at all, which is silent
     and looks exactly like a stylesheet default winning. */
  it('sets a --var so the element actually carries it', () => {
    const node = el('div', { style: { '--tone': 'red' } });
    expect(node.style.getPropertyValue('--tone')).toBe('red');
  });

  it('still sets ordinary properties', () => {
    expect(el('div', { style: { display: 'grid' } }).style.display).toBe('grid');
  });
});

describe('byId throws rather than answering null', () => {
  /* vorlaut-editor's rule. A missing id is a template and a module that have
     drifted apart, not a state two hundred call sites should branch on — and a
     settings sheet lost an id in a refactor on 2026-09-02, which is the case
     this turns from a silent no-op into a named failure. */
  it('finds what the template put there', () => {
    document.body.append(el('p', { attrs: { id: 'line' }, text: 'da' }));
    expect(byId('line').textContent).toBe('da');
  });

  it('names the id it could not find', () => {
    expect(() => byId('folderState')).toThrow(/folderState/);
  });
});

describe('the plain jobs', () => {
  it('takes children, skipping the empty ones', () => {
    const node = el('p', {}, 'a', null, false, undefined, 'b');
    expect(node.textContent).toBe('ab');
  });

  it('fills a container without touching what is outside it', () => {
    const outside = el('i');
    document.body.append(outside, el('div', { attrs: { id: 'box' } }, el('span')));
    fill(byId('box'), el('b', { text: 'neu' }));
    expect(byId('box').innerHTML).toBe('<b>neu</b>');
    expect(outside.isConnected).toBe(true);
  });

  it('wires handlers', () => {
    const heard = vi.fn();
    el('button', { on: { click: heard } }).click();
    expect(heard).toHaveBeenCalledOnce();
  });

  it('toggles a class from a boolean', () => {
    const node = el('div');
    toggleClass(node, 'on', true);
    expect(node.classList.contains('on')).toBe(true);
    toggleClass(node, 'on', false);
    expect(node.classList.contains('on')).toBe(false);
  });

  /* Without the namespace the browser renders an invisible unknown element,
     which looks like a CSS problem for as long as somebody is willing to hunt. */
  it('gives svg its namespace', () => {
    expect(svg('circle', { r: 4 }).namespaceURI).toBe('http://www.w3.org/2000/svg');
  });
});
