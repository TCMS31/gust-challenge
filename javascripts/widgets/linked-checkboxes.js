import {
  STATES,
  deriveControllerState,
  nextCheckedAfterControllerToggle,
  nextStateAfterRelatedToggle,
} from '../lib/linked-checkbox-state';

const CONTROLLER_SELECTOR = '[kjs-role=controllerCheckbox]';
const RELATED_SELECTOR = '[kjs-role=relatedCheckbox]';
const CONTROLLER_ID_ATTRIBUTE = 'kjs-checkbox-id';
const RELATED_ID_ATTRIBUTE = 'kjs-controller-id';
const PARTIAL_OPT_IN_ATTRIBUTE = 'kjs-partial-from-unchecked';

/**
 * Linked checkboxes: one controlling checkbox drives a group of related ones.
 *
 * This module is the DOM adapter only. Every transition rule lives in
 * `lib/linked-checkbox-state`, which knows nothing about elements or events.
 *
 * Markup contract:
 *   <input kjs-role="controllerCheckbox" kjs-checkbox-id="1">
 *   <input kjs-role="relatedCheckbox"    kjs-controller-id="1">
 *
 * Several independent groups may live inside one widget; they are matched by id.
 *
 * @param {Element} widget element carrying kjs-type="linkedCheckboxes"
 */
function linkedCheckboxes(widget) {
  const options = {
    allowPartialFromUnchecked: widget.hasAttribute(PARTIAL_OPT_IN_ATTRIBUTE),
  };

  const { groups, groupOf } = collectGroups(widget);

  function applyState(group, state) {
    group.state = state;
    group.controller.checked = state === STATES.CHECKED;
    group.controller.indeterminate = state === STATES.INDETERMINATE;
    group.controller.dataset.status = state;
  }

  function handleControllerClick(event) {
    const group = groupOf(event.currentTarget);
    if (!group) {
      return;
    }

    // The browser toggles the controller before this handler runs, so the
    // authoritative "before" value is the state we recorded, not the DOM.
    const shouldCheck = nextCheckedAfterControllerToggle(group.state);

    group.related.forEach((checkbox) => {
      checkbox.checked = shouldCheck;
    });

    applyState(group, shouldCheck ? STATES.CHECKED : STATES.UNCHECKED);
  }

  function handleRelatedClick(event) {
    const group = groupOf(event.currentTarget);
    if (!group) {
      return;
    }

    const related = group.related.map((checkbox) => checkbox.checked);
    applyState(group, nextStateAfterRelatedToggle(group.state, related, options));
  }

  function setup() {
    groups.forEach((group) => {
      applyState(group, deriveControllerState(group.related.map((box) => box.checked)));

      const ids = group.related.map((box) => box.id).filter(Boolean);
      if (ids.length > 0) {
        group.controller.setAttribute('aria-controls', ids.join(' '));
      }
    });
  }

  const actions = [];

  groups.forEach((group) => {
    actions.push({ element: group.controller, event: 'click', handler: handleControllerClick });

    group.related.forEach((checkbox) => {
      actions.push({ element: checkbox, event: 'click', handler: handleRelatedClick });
    });
  });

  return { setup, actions };
}

/**
 * Build one group per controller checkbox and an element -> group lookup that
 * covers the controller and all of its related checkboxes.
 *
 * @param {Element} widget
 */
function collectGroups(widget) {
  const relatedByControllerId = new Map();

  Array.from(widget.querySelectorAll(RELATED_SELECTOR)).forEach((checkbox) => {
    const id = checkbox.getAttribute(RELATED_ID_ATTRIBUTE);
    const siblings = relatedByControllerId.get(id) ?? [];
    siblings.push(checkbox);
    relatedByControllerId.set(id, siblings);
  });

  const index = new WeakMap();
  const groups = Array.from(widget.querySelectorAll(CONTROLLER_SELECTOR)).map((controller) => {
    const id = controller.getAttribute(CONTROLLER_ID_ATTRIBUTE);
    const group = {
      controller,
      related: relatedByControllerId.get(id) ?? [],
      state: STATES.UNCHECKED,
    };

    index.set(controller, group);
    group.related.forEach((checkbox) => index.set(checkbox, group));

    return group;
  });

  return { groups, groupOf: (element) => index.get(element) };
}

export default linkedCheckboxes;
