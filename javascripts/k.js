/**
 * k.js — the tiny widget framework this challenge is built on.
 *
 * It scans a document for `[kjs-type]` elements, looks the name up in a
 * registry of widget constructors, and wires the resulting descriptor:
 *
 *   { setup?: () => void, actions: Array<{ element, event, handler }> }
 *
 * The public API (`kjs(constructors, page)`) is unchanged from the version
 * shipped with the challenge. What changed is failure handling: a single bad
 * widget no longer takes the rest of the page down with it.
 */

/** Widget descriptor keys the framework understands. */
const REQUIRED_ACTION_KEYS = ['element', 'event', 'handler'];

function reportError(message, error) {
  console.error(`[kjs] ${message}`, error ?? '');
}

function runSetup(widget) {
  if (typeof widget.setup === 'function') {
    widget.setup();
  }
}

function setListeners(widget, element) {
  const actions = widget.actions ?? [];

  if (!Array.isArray(actions)) {
    reportError(`widget on ${describe(element)} returned a non-array \`actions\``);
    return;
  }

  actions.forEach((action) => {
    const missing = REQUIRED_ACTION_KEYS.filter((key) => !action?.[key]);

    if (missing.length > 0) {
      reportError(`ignoring action on ${describe(element)}; missing ${missing.join(', ')}`);
      return;
    }

    action.element.addEventListener(action.event, action.handler);
  });
}

function describe(element) {
  const type = element.getAttribute('kjs-type');
  return `<${element.tagName.toLowerCase()} kjs-type="${type}">`;
}

/**
 * Mount every `[kjs-type]` widget found in `page`.
 *
 * @param {Record<string, (element: Element) => object>} constructors
 * @param {ParentNode} page
 * @returns {Array<{ name: string, element: Element, widget: object }>} mounted widgets
 */
function kjs(constructors, page) {
  const widgetElements = Array.from(page.querySelectorAll('[kjs-type]'));
  const mounted = [];

  widgetElements.forEach((element) => {
    const name = element.getAttribute('kjs-type');
    const constructor = constructors[name];

    if (typeof constructor !== 'function') {
      reportError(`no widget registered for kjs-type="${name}"; skipping ${describe(element)}`);
      return;
    }

    try {
      const widget = constructor(element);
      runSetup(widget);
      setListeners(widget, element);
      mounted.push({ name, element, widget });
    } catch (error) {
      reportError(`widget "${name}" failed to mount; skipping ${describe(element)}`, error);
    }
  });

  return mounted;
}

export default kjs;
