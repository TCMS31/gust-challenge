import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import kjs from '../javascripts/k';
import { linkedCheckboxMarkup, widgets } from './helpers/dom';

describe('kjs', () => {
  let consoleError;

  beforeEach(() => {
    document.body.innerHTML = '';
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('mounts every [kjs-type] element it finds', () => {
    document.body.innerHTML = `<div kjs-type="alpha"></div><div kjs-type="beta"></div>`;
    const alpha = vi.fn(() => ({ actions: [] }));
    const beta = vi.fn(() => ({ actions: [] }));

    const mounted = kjs({ alpha, beta }, document);

    expect(alpha).toHaveBeenCalledTimes(1);
    expect(beta).toHaveBeenCalledTimes(1);
    expect(mounted.map((entry) => entry.name)).toEqual(['alpha', 'beta']);
  });

  it('runs setup before attaching listeners', () => {
    document.body.innerHTML = `<div kjs-type="alpha"><button></button></div>`;
    const order = [];
    const button = document.querySelector('button');

    kjs(
      {
        alpha: () => ({
          setup: () => order.push('setup'),
          actions: [
            {
              element: button,
              event: 'click',
              handler: () => order.push('click'),
            },
          ],
        }),
      },
      document,
    );

    button.click();
    expect(order).toEqual(['setup', 'click']);
  });

  it('skips an unknown kjs-type without killing the rest of the page', () => {
    // Original framework threw "constructors[widgetName] is not a function"
    // and left every later widget on the page unmounted.
    document.body.innerHTML = `<div kjs-type="typoWidget"></div>${linkedCheckboxMarkup()}`;

    const mounted = kjs(widgets, document);

    expect(mounted.map((entry) => entry.name)).toEqual(['linkedCheckboxes']);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('no widget registered for kjs-type="typoWidget"'),
      '',
    );

    document.getElementById('controller').click();
    expect(document.getElementById('related-1').checked).toBe(true);
  });

  it('isolates a widget whose constructor throws', () => {
    document.body.innerHTML = `<div kjs-type="broken"></div>${linkedCheckboxMarkup()}`;

    const mounted = kjs(
      {
        ...widgets,
        broken: () => {
          throw new Error('boom');
        },
      },
      document,
    );

    expect(mounted.map((entry) => entry.name)).toEqual(['linkedCheckboxes']);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('widget "broken" failed to mount'),
      expect.any(Error),
    );
  });

  it('isolates a widget whose setup throws', () => {
    document.body.innerHTML = `<div kjs-type="broken"></div>${linkedCheckboxMarkup()}`;

    const mounted = kjs(
      {
        ...widgets,
        broken: () => ({
          setup: () => {
            throw new Error('bad markup');
          },
          actions: [],
        }),
      },
      document,
    );

    expect(mounted.map((entry) => entry.name)).toEqual(['linkedCheckboxes']);
  });

  it('ignores malformed actions rather than throwing', () => {
    document.body.innerHTML = `<div kjs-type="alpha"></div>`;

    const mounted = kjs(
      { alpha: () => ({ actions: [{ event: 'click', handler: () => {} }] }) },
      document,
    );

    expect(mounted).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('missing element'), '');
  });

  it('tolerates a widget that returns no actions at all', () => {
    document.body.innerHTML = `<div kjs-type="alpha"></div>`;
    expect(() => kjs({ alpha: () => ({}) }, document)).not.toThrow();
  });
});
