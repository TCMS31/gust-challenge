import kjs from './k';
import drawers from './widgets/drawers';
import extendingForm from './widgets/extending-form';
import linkedCheckboxes from './widgets/linked-checkboxes';
import tabs from './widgets/tabs';

/** Every widget the page knows how to mount, keyed by its `kjs-type`. */
const widgets = { drawers, extendingForm, linkedCheckboxes, tabs };

document.addEventListener('DOMContentLoaded', () => {
  kjs(widgets, document);
});
