/**
 * Drives the built page in a real browser, prints the widget state after each
 * click, and writes the screenshots used in the README.
 *
 * Playwright is deliberately NOT a dependency of this challenge — it is a
 * documentation tool, not part of `npm test`. To run it:
 *
 *   npm run build && npm run serve &
 *   npm install --no-save playwright && npx playwright install chromium
 *   node docs/browser-flow.mjs
 *
 * Override the target with BASE_URL (default http://127.0.0.1:8720).
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'screenshots');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:8720';
const PAGE_URL = `${BASE_URL}/javascript-challenge.html`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

const read = () =>
  page.evaluate(() => {
    const stateOf = (el) =>
      el.indeterminate ? 'indeterminate' : el.checked ? 'checked' : 'unchecked';
    const group = (id) => {
      const controller = document.getElementById(`${id}-controller`);
      return {
        state: stateOf(controller),
        status: controller.dataset.status,
        aria: controller.getAttribute('aria-controls'),
      };
    };
    return {
      fish: group('fish'),
      seuss: group('seuss'),
      seussBoxes: ['seuss-lorax', 'seuss-cat', 'seuss-grinch'].map(
        (id) => document.getElementById(id).checked,
      ),
    };
  });

const log = async (label) => console.log(label.padEnd(22), JSON.stringify(await read()));

await log('ON LOAD');
await page.screenshot({ path: path.join(OUT, '01-widget-gallery.png') });

await page.click('#fish-controller');
await log('click fish controller');
await page.click('#fish-red');
await log('uncheck fish-red');
await page.click('#seuss-grinch');
await log('check seuss-grinch');

await page
  .locator('section.example')
  .first()
  .screenshot({
    path: path.join(OUT, '02-linked-checkboxes.png'),
  });

await page.click('#fish-controller');
await log('click fish controller');
await page.click('#seuss-controller');
await log('click seuss controller');

await page.click('[kjs-type=tabs] [kjs-id="3"]');
await page.click('[kjs-type=drawers] [kjs-id="2"]');
const panels = await page.evaluate(() => ({
  activeTab: document.querySelector('[kjs-role=tab].active').getAttribute('kjs-id'),
  activeContent: document.querySelector('[kjs-role=content].active').getAttribute('kjs-tab-id'),
  openDrawer:
    document.querySelector('[kjs-role=drawer].open')?.getAttribute('kjs-handle-id') ?? null,
}));
console.log('tabs + drawers'.padEnd(22), JSON.stringify(panels));

await page.locator('section.example').nth(2).scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(OUT, '03-tabs-and-drawers.png') });

console.log('console errors'.padEnd(22), JSON.stringify(consoleErrors));
await browser.close();
