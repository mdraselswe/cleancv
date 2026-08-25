/**
 * Puppeteer's postinstall downloads a ~150 MB browser.
 *
 * A serverless build never uses it — `@sparticuz/chromium` supplies the browser
 * there — and downloading it anyway is a slow, failure-prone step in an
 * environment that has no room for the result. Locally it is wanted, but as an
 * explicit step rather than a side effect of `npm install`: `npm run chrome`,
 * which the README already asks for. See ADR-029.
 */
module.exports = { skipDownload: true };
