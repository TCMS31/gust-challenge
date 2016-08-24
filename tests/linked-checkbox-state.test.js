import { describe, expect, it } from 'vitest';
import {
  STATES,
  deriveControllerState,
  nextStateAfterRelatedToggle,
  nextCheckedAfterControllerToggle,
} from '../javascripts/lib/linked-checkbox-state';

const { CHECKED, UNCHECKED, INDETERMINATE } = STATES;

describe('deriveControllerState', () => {
  it('is unchecked when there are no related checkboxes', () => {
    expect(deriveControllerState([])).toBe(UNCHECKED);
  });

  it('is checked when every related checkbox is checked', () => {
    expect(deriveControllerState([true, true, true])).toBe(CHECKED);
  });

  it('is unchecked when no related checkbox is checked', () => {
    expect(deriveControllerState([false, false, false])).toBe(UNCHECKED);
  });

  it('is indeterminate for a partial selection', () => {
    expect(deriveControllerState([true, false, false])).toBe(INDETERMINATE);
    expect(deriveControllerState([true, true, false])).toBe(INDETERMINATE);
  });
});

describe('nextCheckedAfterControllerToggle', () => {
  it('checks the group when the controller was unchecked', () => {
    expect(nextCheckedAfterControllerToggle(UNCHECKED)).toBe(true);
  });

  it('clears the group when the controller was checked', () => {
    expect(nextCheckedAfterControllerToggle(CHECKED)).toBe(false);
  });

  it('clears the group when the controller was in the intermediary state', () => {
    expect(nextCheckedAfterControllerToggle(INDETERMINATE)).toBe(false);
  });
});

describe('nextStateAfterRelatedToggle', () => {
  it('stays unchecked when a related box is checked from the unchecked state', () => {
    // The brief: "if the user clicks on a related checkbox, that checkbox
    // becomes checked, and the controlling checkbox remains unchecked."
    expect(nextStateAfterRelatedToggle(UNCHECKED, [true, false, false, false])).toBe(UNCHECKED);
  });

  it('becomes checked once the last unchecked box is checked', () => {
    expect(nextStateAfterRelatedToggle(UNCHECKED, [true, true, true, true])).toBe(CHECKED);
    expect(nextStateAfterRelatedToggle(INDETERMINATE, [true, true, true, true])).toBe(CHECKED);
  });

  it('becomes indeterminate when a box is unchecked from the checked state', () => {
    expect(nextStateAfterRelatedToggle(CHECKED, [true, true, true, false])).toBe(INDETERMINATE);
  });

  it('stays indeterminate while some boxes remain checked', () => {
    expect(nextStateAfterRelatedToggle(INDETERMINATE, [true, false, false, false])).toBe(
      INDETERMINATE,
    );
  });

  it('returns to unchecked when the last checked box is cleared', () => {
    expect(nextStateAfterRelatedToggle(INDETERMINATE, [false, false, false, false])).toBe(
      UNCHECKED,
    );
  });

  it('honours the Gmail reading when allowPartialFromUnchecked is set', () => {
    expect(
      nextStateAfterRelatedToggle(UNCHECKED, [true, false, false, false], {
        allowPartialFromUnchecked: true,
      }),
    ).toBe(INDETERMINATE);
  });

  it('treats an absent previous state as a plain derivation', () => {
    expect(nextStateAfterRelatedToggle(undefined, [true, false])).toBe(INDETERMINATE);
  });
});
