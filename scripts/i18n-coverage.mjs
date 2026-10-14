/**
 * Walks the app with the interface set to English and lists what is still
 * Bangla - the gaps in the dictionary.
 *
 *   node scripts/i18n-coverage.mjs [baseUrl]
 */
import puppeteer from 'puppeteer';

const base = process.argv[2] || 'http://localhost:3000';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const found = new Map();

const record = (where, items) => {
  for (const item of items) {
    if (!found.has(item)) found.set(item, where);
  }
};

const scan = (page, where) =>
  page.evaluate(() => {
    const out = new Set();
    const bangla = /[অ-হ়-ৎ]/;
    const skip = 'script,style,noscript,.resume-root,textarea,input,[contenteditable="true"],[data-no-translate]';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.data.trim();
      if (bangla.test(text) && !node.parentElement?.closest(skip)) out.add(text.slice(0, 120));
    }
    document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach((element) => {
      if (element.closest('.resume-root')) return;
      for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = element.getAttribute(name);
        if (value && bangla.test(value)) out.add(`@${name}: ${value.slice(0, 100)}`);
      }
    });
    out.add('__title: ' + document.title);

    return [...out].filter((text) => text.startsWith('__title') ? bangla.test(text) : true);
  }).then((items) => record(where, items.filter((item) => item !== '__title: ' || false)));

const open = async (path) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  await page.setCookie({ name: 'cv-lang', value: 'en', url: base });
  await page.goto(base + path, { waitUntil: 'networkidle2', timeout: 280000 });
  await page.waitForSelector('html[data-i18n-ready]', { timeout: 60000 }).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 800));

  return page;
};

const clickText = async (page, text) =>
  page.evaluate((needle) => {
    const target = [...document.querySelectorAll('button, a, [role="menuitem"], label')].find((element) =>
      (element.textContent || '').trim() === needle || (element.getAttribute('title') || '') === needle,
    );
    if (!target) return false;
    target.click();

    return true;
  }, text);

const settle = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

for (const path of ['/', '/features', '/sign-in', '/sign-up', '/privacy', '/terms', '/does-not-exist']) {
  const page = await open(path);
  await scan(page, path);
  await page.close();
}

// The editor, with the example CV, through every panel and dialog.
{
  const page = await open('/editor');
  await scan(page, '/editor (first run)');
  await clickText(page, 'Fill with example data');
  await settle(1500);
  await scan(page, '/editor (example)');

  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label] button')].map((button) => button.getAttribute('title') || button.textContent.trim()),
  );

  for (const label of [...new Set(tabs)].filter(Boolean)) {
    await clickText(page, label);
    await settle(500);
    await scan(page, `/editor panel: ${label}`);

    // Expand the first entry card, so the form fields are on screen.
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('[aria-expanded="false"]')].find((element) => element.closest('main, div'));
      card?.click();
    });
    await settle(300);
    await scan(page, `/editor panel (expanded): ${label}`);
  }

  for (const [name, selector] of [
    ['score drawer', 'ATS'],
    ['my cvs', 'My CVs — switch, duplicate or back up'],
    ['more actions', 'More actions'],
    ['download options', 'More download options'],
  ]) {
    await clickText(page, selector);
    await settle(600);
    await scan(page, `/editor ${name}`);
    await page.keyboard.press('Escape');
    await settle(200);
  }

  await page.close();
}

await browser.close();

const rows = [...found.entries()];
console.log(`still Bangla in English mode: ${rows.length}`);
for (const [text, where] of rows) console.log(`  [${where}] ${text}`);
