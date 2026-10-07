// Click-through smoke test of the navigation flows. Usage: node scripts/smoke.mjs [baseUrl]
// Extend as phases add flows. Exits non-zero on any failed expectation or console error.
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173'
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
let failures = 0
const expectPath = async (want, label) => {
  await page.waitForTimeout(500)
  const got = new URL(page.url()).pathname
  const ok = got === want
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${got}${ok ? '' : ` (wanted ${want})`}`)
}

await page.goto(base + '/')
await expectPath('/s/home', 'root redirects to student home by default')

await page.getByRole('button', { name: 'Opportunities' }).first().click()
await expectPath('/s/opportunities', 'tab bar navigates')

await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('tab', { name: 'Agency' }).click()
await expectPath('/a/home', 'demo sheet switches to agency')

await page.goto(base + '/a/tiers')
await page.waitForTimeout(400)
const gated = await page.getByText('Not available for your role').isVisible()
console.log(`${gated ? 'PASS' : 'FAIL'} programme officer is gated from Repayment tiers`)
if (!gated) failures++

await page.getByRole('button', { name: 'PTPTN Agency' }).click()
await page.getByRole('tab', { name: 'Student' }).click()
await expectPath('/s/home', 'agency drawer switches back to student')

await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Nurul Aina/ }).click()
await expectPath('/s/onboarding/activities', 'Nurul resumes onboarding at step 5')

await page.getByRole('button', { name: 'Next step' }).click()
await expectPath('/s/onboarding/preferences', 'onboarding advances')

await page.goto(base + '/')
await expectPath('/s/onboarding/activities', 'root remembers student role (persona Nurul → home path)')

if (errors.length) {
  failures++
  console.log('Console errors:\n' + errors.join('\n'))
}
await browser.close()
console.log(failures ? `${failures} failure(s)` : 'all passed')
process.exit(failures ? 1 : 0)
