/* Run against an existing exported web server (GUIDE_URL defaults to localhost:8094). */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
    await page.goto(process.env.GUIDE_URL || 'http://127.0.0.1:8094');
    await page.getByTestId('guide-card').waitFor();
    await page.getByRole('button', { name: 'Choose muscle by name', exact: true }).click();
    await page.getByRole('button', { name: 'Chest', exact: true }).click();
    await page.getByRole('button', { name: 'Hide muscle list', exact: true }).click();
    await page.getByRole('button', { name: 'Expand Chest exercises', exact: true }).click();
    const target = page.getByTestId('guide-add');
    const add = page.getByRole('button', { name: 'Add Bench Press', exact: true });
    await target.waitFor();
    const before = await target.boundingBox(), buttonBefore = await add.boundingBox();
    const cardBefore = await page.getByTestId('guide-card').boundingBox();
    const moved = await target.evaluate(node => {
      let parent = node.parentElement;
      while (parent && parent.scrollHeight <= parent.clientHeight + 10) parent = parent.parentElement;
      if (!parent) return false;
      parent.scrollTop += 35;
      return parent.scrollTop > 0;
    });
    assert.ok(moved, 'exercise list must scroll');
    await page.waitForTimeout(300);
    const after = await target.boundingBox(), buttonAfter = await add.boundingBox();
    assert.ok(Math.abs((after.y-before.y)-(buttonAfter.y-buttonBefore.y)) < 1, 'highlight follows real Add control');
    assert.ok(Math.abs(after.y-before.y) > 5, 'target actually moved');
    assert.equal((await page.getByTestId('guide-card').boundingBox()).y, cardBefore.y);
    assert.notEqual(await target.evaluate(node => getComputedStyle(node).borderTopColor), 'rgba(0, 0, 0, 0)');
    await add.click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: /^Start workout/ }).click();
    await page.getByText("You're set", { exact: true }).waitFor();
    await page.getByRole('checkbox', { name: 'Bench Press, set 1 of 3, not done', exact: true }).waitFor();
    await page.screenshot({ path: '../.tmp/release-qa/guide-complete-360.png' });
    console.log('PASS three real actions / moving control highlight / fixed guide card / 360px workout entry');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
