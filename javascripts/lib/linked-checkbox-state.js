/**
 * Pure state machine for the linked-checkbox widget.
 *
 * Nothing in this file touches the DOM. It takes the booleans of the related
 * checkboxes plus the controller's previous state and returns the next state,
 * which makes every rule in the challenge brief testable in isolation.
 */

/** @typedef {'checked' | 'unchecked' | 'indeterminate'} ControllerState */

const CHECKED = 'checked';
const UNCHECKED = 'unchecked';
const INDETERMINATE = 'indeterminate';

export const STATES = Object.freeze({ CHECKED, UNCHECKED, INDETERMINATE });

/**
 * The brief contains one genuine ambiguity. It says:
 *
 *   "When controlling checkbox is unchecked: if the user clicks on a related
 *    checkbox, that checkbox becomes checked, and the controlling checkbox
 *    remains unchecked."
 *
 * ...but it also says "for an example of this behavior, check out a gmail
 * inbox", and Gmail moves its header checkbox to the dash state as soon as one
 * row is selected. The two cannot both be satisfied.
 *
 * The literal wording wins by default, because that is what was written down.
 * `allowPartialFromUnchecked: true` selects the Gmail reading instead, and the
 * widget exposes it as the `kjs-partial-from-unchecked` attribute.
 */
const DEFAULT_OPTIONS = Object.freeze({ allowPartialFromUnchecked: false });

/**
 * Derive the controller state implied purely by the related checkboxes,
 * ignoring history. Used on mount, where there is no previous state.
 *
 * @param {boolean[]} related
 * @returns {ControllerState}
 */
export function deriveControllerState(related) {
  if (related.length === 0) {
    return UNCHECKED;
  }
  if (related.every(Boolean)) {
    return CHECKED;
  }
  if (related.every((isChecked) => !isChecked)) {
    return UNCHECKED;
  }
  return INDETERMINATE;
}

/**
 * The controller state after the user toggled one of the related checkboxes.
 *
 * @param {ControllerState | undefined} previous controller state before the click
 * @param {boolean[]} related checked-ness of every related checkbox, after the click
 * @param {{ allowPartialFromUnchecked?: boolean }} [options]
 * @returns {ControllerState}
 */
export function nextStateAfterRelatedToggle(previous, related, options = {}) {
  const { allowPartialFromUnchecked } = { ...DEFAULT_OPTIONS, ...options };
  const derived = deriveControllerState(related);

  if (derived !== INDETERMINATE) {
    return derived;
  }

  // Partial selection. Per the literal brief an *unchecked* controller stays
  // unchecked; every other previous state lands on the intermediary state.
  if (previous === UNCHECKED && !allowPartialFromUnchecked) {
    return UNCHECKED;
  }

  return INDETERMINATE;
}

/**
 * What the related checkboxes become when the user clicks the controller.
 *
 * All three branches of the brief collapse to one rule: only an unchecked
 * controller checks its group; checked and intermediary both clear it.
 *
 * @param {ControllerState} previous controller state before the click
 * @returns {boolean} whether every related checkbox should now be checked
 */
export function nextCheckedAfterControllerToggle(previous) {
  return previous === UNCHECKED;
}
