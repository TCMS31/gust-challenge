import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from './helpers/dom';

const TABS_MARKUP = `<div kjs-type="tabs">
  <ul>
    <li kjs-role="tab" kjs-id="1" class="active"><span id="tab-1-label">One</span></li>
    <li kjs-role="tab" kjs-id="2">Two</li>
  </ul>
  <div kjs-role="content" kjs-tab-id="1" id="content-1"></div>
  <div kjs-role="content" kjs-tab-id="2" id="content-2"></div>
</div>`;

const DRAWERS_MARKUP = `<div kjs-type="drawers">
  <div kjs-role="handle" kjs-id="1" id="handle-1"><span id="handle-1-label">One</span></div>
  <div kjs-role="drawer" kjs-handle-id="1" id="drawer-1"></div>
  <div kjs-role="handle" kjs-id="2" id="handle-2">Two</div>
  <div kjs-role="drawer" kjs-handle-id="2" id="drawer-2"></div>
</div>`;

const FORM_MARKUP = `<form kjs-type="extendingForm">
  <select kjs-role="toggle" id="toggle">
    <option value="" selected>Select one</option>
    <option value="yes">Yes</option>
  </select>
  <div kjs-role="extension" kjs-trigger="yes" id="extension-yes"></div>
</form>`;

const isOpen = (id) => document.getElementById(id).classList.contains('open');
const isActive = (id) => document.getElementById(id).classList.contains('active');

describe('tabs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('reveals the content pane matching the active tab', () => {
    mount(TABS_MARKUP);
    expect(isActive('content-1')).toBe(true);
    expect(isActive('content-2')).toBe(false);
  });

  it('switches panes when another tab is clicked', () => {
    mount(TABS_MARKUP);
    document.querySelector('[kjs-id="2"]').click();
    expect(isActive('content-1')).toBe(false);
    expect(isActive('content-2')).toBe(true);
  });

  it('activates the first tab when the markup marks none active', () => {
    // Original widget threw on `activeTab.getAttribute` and, because kjs had no
    // error isolation, unmounted every widget after it.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(TABS_MARKUP.replace(' class="active"', ''));

    expect(isActive('content-1')).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('handles a click that lands on markup inside the tab', () => {
    mount(TABS_MARKUP);
    document.querySelector('[kjs-id="2"]').click();
    document.getElementById('tab-1-label').click();
    expect(isActive('content-1')).toBe(true);
  });

  it('mounts a tabs widget with no tabs without throwing', () => {
    expect(() => mount('<div kjs-type="tabs"></div>')).not.toThrow();
  });
});

describe('drawers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the drawer belonging to the clicked handle', () => {
    mount(DRAWERS_MARKUP);
    document.getElementById('handle-1').click();
    expect(isOpen('drawer-1')).toBe(true);
  });

  it('closes any other open drawer', () => {
    mount(DRAWERS_MARKUP);
    document.getElementById('handle-1').click();
    document.getElementById('handle-2').click();
    expect(isOpen('drawer-1')).toBe(false);
    expect(isOpen('drawer-2')).toBe(true);
  });

  it('toggles a drawer closed when its own handle is clicked twice', () => {
    mount(DRAWERS_MARKUP);
    document.getElementById('handle-1').click();
    document.getElementById('handle-1').click();
    expect(isOpen('drawer-1')).toBe(false);
  });

  it('handles a click that lands on markup inside the handle', () => {
    // Original widget read kjs-id off e.target, which is the inner span here,
    // so no drawer matched and nothing opened.
    mount(DRAWERS_MARKUP);
    document.getElementById('handle-1-label').click();
    expect(isOpen('drawer-1')).toBe(true);
  });
});

describe('extendingForm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('hides extensions that do not match the current value', () => {
    mount(FORM_MARKUP);
    expect(document.getElementById('extension-yes').classList.contains('reveal')).toBe(false);
  });

  it('reveals the extension matching the selected value', () => {
    mount(FORM_MARKUP);
    const toggle = document.getElementById('toggle');
    toggle.value = 'yes';
    toggle.dispatchEvent(new window.Event('change'));
    expect(document.getElementById('extension-yes').classList.contains('reveal')).toBe(true);
  });

  it('mounts without a toggle rather than throwing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => mount('<form kjs-type="extendingForm"></form>')).not.toThrow();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
