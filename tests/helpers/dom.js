import kjs from '../../javascripts/k';
import drawers from '../../javascripts/widgets/drawers';
import extendingForm from '../../javascripts/widgets/extending-form';
import linkedCheckboxes from '../../javascripts/widgets/linked-checkboxes';
import tabs from '../../javascripts/widgets/tabs';

export const widgets = { drawers, extendingForm, linkedCheckboxes, tabs };

/** Render markup into the test document and mount every widget in it. */
export function mount(markup, constructors = widgets) {
  document.body.innerHTML = markup;
  return kjs(constructors, document);
}

/**
 * Markup for a single linked-checkbox group.
 *
 * @param {{ count?: number, checked?: number[], attributes?: string }} [options]
 */
export function linkedCheckboxMarkup({ count = 4, checked = [], attributes = '' } = {}) {
  const related = Array.from({ length: count }, (_unused, index) => {
    const n = index + 1;
    const isChecked = checked.includes(n) ? ' checked' : '';
    return `<input type="checkbox" kjs-role="relatedCheckbox" kjs-controller-id="1" id="related-${n}"${isChecked}>`;
  }).join('');

  return `<div kjs-type="linkedCheckboxes" ${attributes}>
    <input type="checkbox" kjs-role="controllerCheckbox" kjs-checkbox-id="1" id="controller">
    ${related}
  </div>`;
}

export const controller = () => document.getElementById('controller');
export const related = (n) => document.getElementById(`related-${n}`);
export const relatedAll = () => Array.from(document.querySelectorAll('[kjs-role=relatedCheckbox]'));

/** Compact snapshot of a group: controller state plus the related checkboxes. */
export function snapshot() {
  const node = controller();
  const state = node.indeterminate ? 'indeterminate' : node.checked ? 'checked' : 'unchecked';
  return {
    state,
    status: node.dataset.status,
    related: relatedAll().map((box) => box.checked),
  };
}
