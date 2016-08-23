/**
 * Extending form: a select whose value reveals the extension block carrying a
 * matching `kjs-trigger`.
 *
 * @param {Element} widget element carrying kjs-type="extendingForm"
 */
function extendingForm(widget) {
  const extensions = Array.from(widget.querySelectorAll('[kjs-role=extension]'));
  const toggle = widget.querySelector('[kjs-role=toggle]');

  if (!toggle) {
    return { actions: [] };
  }

  function setup() {
    extensions.forEach((extension) => {
      const reveal = toggle.value === extension.getAttribute('kjs-trigger');
      extension.classList.toggle('reveal', reveal);
    });
  }

  const actions = [{ element: toggle, event: 'change', handler: setup }];

  return { setup, actions };
}

export default extendingForm;
