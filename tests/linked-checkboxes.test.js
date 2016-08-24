import { beforeEach, describe, expect, it } from 'vitest';
import { controller, linkedCheckboxMarkup, mount, related, snapshot } from './helpers/dom';

describe('linkedCheckboxes widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('starts unchecked with an empty group', () => {
    mount(linkedCheckboxMarkup());
    expect(snapshot()).toEqual({
      state: 'unchecked',
      status: 'unchecked',
      related: [false, false, false, false],
    });
  });

  describe('when the controller is unchecked', () => {
    it('checks every related checkbox when the controller is clicked', () => {
      mount(linkedCheckboxMarkup());
      controller().click();
      expect(snapshot()).toEqual({
        state: 'checked',
        status: 'checked',
        related: [true, true, true, true],
      });
    });

    it('leaves the controller unchecked when a related checkbox is clicked', () => {
      mount(linkedCheckboxMarkup());
      related(2).click();
      expect(snapshot()).toEqual({
        state: 'unchecked',
        status: 'unchecked',
        related: [false, true, false, false],
      });
    });
  });

  describe('when the controller is checked', () => {
    it('clears every related checkbox when the controller is clicked', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2, 3, 4] }));
      controller().click();
      expect(snapshot()).toEqual({
        state: 'unchecked',
        status: 'unchecked',
        related: [false, false, false, false],
      });
    });

    it('enters the intermediary state when a related checkbox is cleared', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2, 3, 4] }));
      related(3).click();
      expect(snapshot()).toEqual({
        state: 'indeterminate',
        status: 'indeterminate',
        related: [true, true, false, true],
      });
    });
  });

  describe('when the controller is in the intermediary state', () => {
    it('clears everything when the controller is clicked', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2] }));
      expect(snapshot().state).toBe('indeterminate');

      controller().click();
      expect(snapshot()).toEqual({
        state: 'unchecked',
        status: 'unchecked',
        related: [false, false, false, false],
      });
    });

    it('stays intermediary while checked boxes remain', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2] }));
      related(1).click();
      expect(snapshot().state).toBe('indeterminate');
    });

    it('returns to unchecked when the last checked box is cleared', () => {
      mount(linkedCheckboxMarkup({ checked: [1] }));
      related(1).click();
      expect(snapshot()).toEqual({
        state: 'unchecked',
        status: 'unchecked',
        related: [false, false, false, false],
      });
    });

    it('returns to checked when the last unchecked box is checked', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2, 3] }));
      related(4).click();
      expect(snapshot()).toEqual({
        state: 'checked',
        status: 'checked',
        related: [true, true, true, true],
      });
    });
  });

  describe('regressions', () => {
    it('reflects pre-checked markup on mount instead of reporting unchecked', () => {
      // Original widget had no setup(): two of four boxes pre-checked still
      // rendered an unchecked controller.
      mount(linkedCheckboxMarkup({ checked: [1, 2] }));
      expect(snapshot()).toEqual({
        state: 'indeterminate',
        status: 'indeterminate',
        related: [true, true, false, false],
      });
    });

    it('survives a full round trip from pre-checked markup', () => {
      mount(linkedCheckboxMarkup({ checked: [1, 2] }));
      controller().click();
      expect(snapshot().state).toBe('unchecked');
      controller().click();
      expect(snapshot()).toEqual({
        state: 'checked',
        status: 'checked',
        related: [true, true, true, true],
      });
    });

    it('keeps independent groups isolated', () => {
      mount(`<div kjs-type="linkedCheckboxes">
        <input type="checkbox" kjs-role="controllerCheckbox" kjs-checkbox-id="a" id="ctl-a">
        <input type="checkbox" kjs-role="relatedCheckbox" kjs-controller-id="a" id="a-1">
        <input type="checkbox" kjs-role="controllerCheckbox" kjs-checkbox-id="b" id="ctl-b">
        <input type="checkbox" kjs-role="relatedCheckbox" kjs-controller-id="b" id="b-1">
      </div>`);

      document.getElementById('ctl-a').click();

      expect(document.getElementById('a-1').checked).toBe(true);
      expect(document.getElementById('b-1').checked).toBe(false);
      expect(document.getElementById('ctl-b').checked).toBe(false);
    });

    it('links the controller to its group for assistive technology', () => {
      mount(linkedCheckboxMarkup());
      expect(controller().getAttribute('aria-controls')).toBe(
        'related-1 related-2 related-3 related-4',
      );
    });

    it('tolerates a controller with no related checkboxes', () => {
      mount(`<div kjs-type="linkedCheckboxes">
        <input type="checkbox" kjs-role="controllerCheckbox" kjs-checkbox-id="1" id="controller">
      </div>`);

      expect(() => controller().click()).not.toThrow();
      expect(controller().dataset.status).toBe('checked');
    });
  });

  describe('kjs-partial-from-unchecked opt-in', () => {
    it('goes intermediary as soon as one box is checked', () => {
      mount(linkedCheckboxMarkup({ attributes: 'kjs-partial-from-unchecked' }));
      related(1).click();
      expect(snapshot().state).toBe('indeterminate');
    });
  });
});
