// Batch screenshots for phase checks.
// Usage: node scripts/shots.mjs <spec.json> [baseUrl]
// spec: [{ "name": "home-390", "path": "/s/home", "w": 390, "h": 844, "full": false,
//          "prefs": { "role": "student", "persona": "hafiz" }, "js": ["…"], "wait": 600 }]
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const [specPath, base = 'http://localhost:4173'] = process.argv.slice(2)
const shots = JSON.parse(readFileSync(specPath, 'utf8'))
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
mkdirSync('screenshots', { recursive: true })
const browser = await chromium.launch({ executablePath })
let failed = false

for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w ?? 390, height: s.h ?? 844 } })
  const prefs = s.prefs ?? {}
  await ctx.addInitScript((p) => {
    for (const [k, v] of Object.entries(p)) localStorage.setItem(`ptptn.${k}`, v)
  }, prefs)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(base + s.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  for (const js of s.js ?? []) {
    await page.evaluate(js)
    await page.waitForTimeout(450)
  }
  await page.waitForTimeout(s.wait ?? 500)
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  await page.screenshot({ path: `screenshots/${s.name}.png`, fullPage: !!s.full })
  const overflow = sw > (s.w ?? 390) ? ` OVERFLOW scrollWidth=${sw}` : ''
  if (errors.length || overflow) failed = true
  console.log(`${s.name}: ${errors.length ? 'ERRORS ' + errors.join(' | ') : 'ok'}${overflow}`)
  await ctx.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
