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

await page.getByRole('button', { name: 'Continue', exact: true }).click()
await expectPath('/s/onboarding/preferences', 'onboarding advances')
await page.getByRole('button', { name: 'Back' }).click()

await page.goto(base + '/')
await expectPath('/s/onboarding/activities', 'root remembers student role (persona Nurul → home path)')


// ---------------------------------------------------------------- Phase 2: onboarding → profile
const check = (ok, label) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
}
const btn = (name) => page.getByRole('button', { name, exact: true })

await page.goto(base + '/s/onboarding/activities?fast=1')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Add another/ }).click()
await page.getByRole('button', { name: /Fill with an example/ }).click()
await btn('Save activity').click()
await page.waitForTimeout(500)
check((await page.getByText('Exco logistik').count()) > 0, 'activity added from example')
await btn('Continue').click()
await expectPath('/s/onboarding/preferences', 'activities → preferences')
await btn('Marketing').click()
await btn('Continue').click()
await expectPath('/s/onboarding/translating', 'preferences → translating')
await page.waitForTimeout(4000)
await expectPath('/s/onboarding/reveal', 'translation finishes → reveal')
check(await page.getByRole('heading', { name: /We found \d+ skills/ }).isVisible(), 'reveal headline shows skill count')
await btn('Review my skills').click()
await expectPath('/s/onboarding/review', 'reveal → review')
const hideButtons = page.getByRole('button', { name: 'Hide', exact: true })
await hideButtons.first().click()
await page.waitForTimeout(300)
check((await page.getByText('Hidden from employers').count()) > 0, 'hide marks a skill hidden')
await page.getByRole('button', { name: 'This isn’t right' }).nth(1).click()
await btn('Send for review').click()
await page.waitForTimeout(800)
check((await page.getByText('Under review').count()) > 0, 'dispute marks a skill under review')
await btn('Confirm my skills').click()
await expectPath('/s/onboarding/visible', 'review → visible')
check(await page.getByText('Exactly what employers see').isVisible(), 'employer preview shown')
check((await page.getByText('Nurul Aina').locator('visible=true').count()) === 0, 'employer preview hides the name')
await btn('Finish and go to Home').click()
await expectPath('/s/home', 'finish → home')
// In-app navigation: a full reload would reseed the in-memory demo data.
await page.getByRole('button', { name: 'Profile' }).first().click()
await page.waitForTimeout(600)
check((await page.getByText('Logistics coordination').locator('visible=true').count()) > 0, 'profile shows newly translated skills (Logistics coordination from the example)')

// Hafiz: add evidence → re-score
await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Muhammad Hafiz/ }).click()
await page.goto(base + '/s/profile')
await page.waitForTimeout(600)
await page.locator('article button', { hasText: 'Team leadership' }).first().click()
await btn('Add evidence').click()
await page.getByRole('button', { name: /Certificate/ }).click()
await page.waitForTimeout(2200)
check(await page.getByText(/Team leadership: Working → Advanced/).isVisible(), 're-score shows Working → Advanced')

// Reset demo returns Nurul to step 5
await btn('Done').click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Demo' }).click()
await btn('Reset demo').click()
await page.goto(base + '/')
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Nurul Aina/ }).click()
await expectPath('/s/onboarding/activities', 'reset demo puts Nurul back at step 5')

if (errors.length) {
  failures++
  console.log('Console errors:\n' + errors.join('\n'))
}
await browser.close()
console.log(failures ? `${failures} failure(s)` : 'all passed')
process.exit(failures ? 1 : 0)
