// Usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [fullPage] [extra js]
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
const [url, out, w = '1440', h = '900', full = '1', js = ''] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(url, { waitUntil: 'networkidle' })
if (js) await page.evaluate(js)
await page.waitForTimeout(900)
await page.screenshot({ path: out, fullPage: full === '1' })
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors')
await browser.close()
