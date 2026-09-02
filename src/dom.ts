/*
 * Making an element, and finding one. Four products, four answers, and one name
 * that meant two opposite things.
 *
 * Before this file: bildhaft and wochenwerk each had `el(tag, props, …children)`
 * — near-identical, 116 and 94 lines, arrived at separately. mitreden had
 * `el(id)`, which *reads* an element rather than making one. vorlaut-editor had
 * `$(id)` for the reading and no builder at all: `document.createElement`
 * fifty-odd times, twenty-seven of them in one file.
 *
 * So `el` built a node in two products and fetched one in a third. That is worse
 * than duplication — a duplicate is merely wasteful, and a name meaning opposite
 * things in sibling repositories is a trap for whoever moves between them, which
 * in this family is everybody.
 *
 * The two are separated here by name and cannot be confused again: **`el` makes,
 * `byId` finds.** `$` is not offered. It was vorlaut-editor's word for the
 * finder and reads well in that file, but a one-character export in a shared
 * package is a name nobody can search for.
 *
 * ## What each product contributed
 *
 * bildhaft's builder is the base: it had been through the most surfaces and had
 * the `html`, `style` and custom-property handling the others lacked. Two rules
 * come from elsewhere and would have been lost by taking one copy whole:
 *
 * - **wochenwerk's ARIA rule.** An ARIA state is a word, not a bare attribute.
 *   `hidden` and `disabled` mean something by being present at all, so `true`
 *   writes `""` and `false` removes them — but `aria-checked=""` is not checked,
 *   it is unreadable, and a radio that is not the answer has to say
 *   `aria-checked="false"` rather than say nothing. Two call sites over there
 *   wrote `"aria-checked": live` and both silently produced neither state; the
 *   picker only looked right because a class beside it was carrying the paint.
 * - **vorlaut-editor's throwing finder.** `byId` throws rather than answering
 *   null, and that is the whole of the change from the JavaScript it came from:
 *   every caller is asking for something the product's own template put in the
 *   document, so a null is not a case to handle — it is a template and a module
 *   that have drifted apart. Returning null made two hundred call sites carry a
 *   branch for a state that means the page is broken. This is not theoretical:
 *   a settings sheet lost an id in a refactor on 2026-09-02 and the throw is
 *   what would have named it, rather than a language pass quietly doing nothing.
 */

type Child = Node | string | number | null | undefined | false;

export interface Props {
  class?: string;
  text?: string;
  html?: string;
  /**
   * Applied with setAttribute, so aria-*, role, data-* and the rest work.
   *
   * `true` writes a bare attribute, which is what boolean attributes such as
   * `hidden` and `disabled` want. Enumerated attributes — draggable,
   * contenteditable, spellcheck — are not boolean: a bare one reads as "auto",
   * so pass those the literal string 'true'.
   *
   * ARIA states are the third case and the one that was got wrong twice: see
   * the header. A boolean on an `aria-` attribute is written out as the word.
   */
  attrs?: Record<string, string | number | boolean | null | undefined>;
  /**
   * Inline styles. Custom properties are allowed and are set through
   * setProperty — assigning them onto the style object does nothing, which is
   * silent and looks exactly like a stylesheet default winning.
   */
  style?: Partial<CSSStyleDeclaration> & Record<`--${string}`, string>;
  /** Event handlers, keyed by event name without "on". */
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => void }>;
}

function apply(node: HTMLElement | SVGElement, props: Props): void {
  if (props.class) node.setAttribute('class', props.class);
  if (props.text !== undefined) node.textContent = props.text;
  if (props.html !== undefined) node.innerHTML = props.html;

  for (const [name, value] of Object.entries(props.attrs ?? {})) {
    // An ARIA state is a word. `false` there means "false", not "absent".
    if (name.startsWith('aria-') && typeof value === 'boolean') node.setAttribute(name, String(value));
    // Otherwise: false and null remove the attribute; true writes it bare.
    else if (value === false || value === null || value === undefined) node.removeAttribute(name);
    else node.setAttribute(name, value === true ? '' : String(value));
  }

  for (const [name, value] of Object.entries(props.style ?? {})) {
    if (name.startsWith('--')) node.style.setProperty(name, String(value));
    else (node.style as unknown as Record<string, unknown>)[name] = value;
  }

  for (const [name, handler] of Object.entries(props.on ?? {})) {
    node.addEventListener(name, handler as EventListener);
  }
}

function append(node: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/** Makes an element. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  apply(node, props);
  append(node, children);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG needs its namespace, or the browser renders an invisible unknown element. */
export function svg(
  tag: string,
  attrs: Record<string, string | number> = {},
  ...children: Child[]
): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  append(node, children);
  return node;
}

/** Replaces a container's contents in one go, without touching anything outside it. */
export function fill(container: Element, ...children: Child[]): void {
  container.replaceChildren();
  append(container, children);
}

/** Adds or removes a class from its boolean, which reads better than an if. */
export function toggleClass(node: Element, name: string, on: boolean): void {
  node.classList.toggle(name, on);
}

/**
 * Finds an element the page's own template put there, by id.
 *
 * **Throws rather than answering null.** See the header: a missing id is a
 * template and a module that have drifted apart, not a state to branch on.
 */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`No element with id "${id}" in the page.`);
  return node as T;
}
