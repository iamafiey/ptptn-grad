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

// ---------------------------------------------------------------- Phase 3: Home + Opportunities
await btn('Done').click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Muhammad Hafiz/ }).click()
await page.waitForTimeout(700)
check(await page.getByRole('heading', { name: /2 partners want to talk/ }).isVisible(), 'Hafiz home hero: 2 partners want to talk')
await page.getByRole('button', { name: /A Talent Partner wants to talk/ }).click()
await page.waitForTimeout(700)
check(await page.getByRole('dialog', { name: 'Logistics Executive (Graduate)' }).isVisible(), 'next step opens the invitation')
await btn('Accept and share profile').click()
await btn('Share my profile').click()
await page.waitForTimeout(700)
check((await page.getByText('Profile shared with Seri Mutiara Logistik Berhad').count()) > 0, 'accept shares profile')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// Apply on a portal → pending entry → add evidence → verified
await page.getByRole('tab', { name: 'Open jobs' }).click()
await page.waitForTimeout(400)
const firstJob = page.locator('article button').first()
const jobTitle = (await firstJob.locator('.t-subheading').textContent()).trim()
await firstJob.click()
await page.getByRole('button', { name: /Apply on / }).click()
await page.waitForTimeout(600)
await page.getByRole('tab', { name: 'My job search log' }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: new RegExp(jobTitle) }).first().click()
await page.waitForTimeout(300)
check((await page.getByText('Needs evidence').locator('visible=true').count()) > 0, 'applied job appears as pending in the log')
await btn('Add evidence').click()
await page.getByRole('button', { name: /Confirmation email/ }).click()
await page.waitForTimeout(3400)
check(await page.getByText('This counts toward your monthly job-seeking record.').isVisible(), 'sample email is auto-verified')
await btn('Done').click()
await page.waitForTimeout(500)
check((await page.getByText('Active job-seeking record: on track').count()) > 0, 'monthly threshold met after 4th verified')

// Kavitha: Tier B — benefits paused, locked roles, and no repayment amounts anywhere on Home / Opportunities
await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Kavitha/ }).click()
await page.waitForTimeout(700)
check((await page.getByText('3 benefits are paused').count()) > 0, 'Kavitha next step: 3 benefits paused')
const homeText = await page.locator('main, body').first().innerText()
check(!/RM\s?180|arrears|tunggakan/i.test(homeText), 'no repayment amount or "arrears" on Home')
await page.getByRole('button', { name: 'Opportunities' }).first().click()
await page.waitForTimeout(600)
check((await page.getByRole('button', { name: 'Unlock with good standing' }).count()) > 0, 'Tier B sees locked partner roles')
const oppText = await page.locator('body').innerText()
check(!/RM\s?180|arrears|tunggakan/i.test(oppText), 'no repayment amount or "arrears" on Opportunities')

// ---------------------------------------------------------------- Phase 4: Learn + Repayment
// Kavitha (still selected): preview course stops after module 1, then a way back restores Tier A.
await page.getByRole('button', { name: 'Learn' }).first().click()
await page.waitForTimeout(600)
await page.locator('article button', { hasText: 'Preview' }).first().click()
await btn('Enrol').click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Continue module 1/ }).click()
await page.waitForTimeout(800)
check(await page.getByText('That’s the end of the preview.', { exact: false }).isVisible(), 'Tier B preview stops after module 1')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Repayment' }).first().click()
await page.waitForTimeout(600)
check(await page.getByText('Ways back to good standing', { exact: false }).isVisible(), 'Kavitha sees ways back')
await page.locator('article button', { hasText: 'Set up salary deduction' }).click()
await btn('Continue').click()
await page.waitForTimeout(900)
check(await page.getByText('Waiting for confirmation').isVisible(), 'way back is pending until sync')
await page.getByRole('button', { name: /simulate sync confirmed/ }).click()
await page.waitForTimeout(1400)
check(await page.getByRole('heading', { name: /Your benefits are back/ }).isVisible(), 'sync confirmed → Tier A celebration')
await btn('See partner roles').click()
await page.waitForTimeout(700)
check((await page.getByRole('button', { name: 'Unlock with good standing' }).count()) === 0, 'after restore, no partner roles are locked')

// Hafiz: close the Report writing gap with a course → certificate → re-score
await page.getByRole('button', { name: 'Demo' }).click()
await page.getByRole('button', { name: /Muhammad Hafiz/ }).click()
await page.waitForTimeout(700)
await page.getByRole('button', { name: 'Close this gap' }).first().click()
await page.waitForTimeout(600)
check((await page.getByRole('heading', { name: 'Report writing' }).count()) > 0, 'gap view opens for Report writing')
await page.locator('article button', { hasText: 'Report Writing for the Workplace' }).click()
await btn('Enrol').click()
await page.waitForTimeout(600)
for (const n of [1, 2, 3]) {
  await page.getByRole('button', { name: `Continue module ${n}` }).click()
  await page.waitForTimeout(700)
}
await btn('Complete course').click()
await page.waitForTimeout(2200)
check(await page.getByText(/Report writing: Not yet|Report writing: Foundation → Working/).isVisible(), 'course completion re-scores the skill')
const matchLine = await page.locator('[role=dialog] p.t-subheading').innerText()
console.log(`      result line: "${matchLine}"`)
await btn('See it on your profile').click()
await page.waitForTimeout(600)
check((await page.getByText('Report writing').locator('visible=true').count()) > 0, 'skill appears on profile with certificate')

// Reset demo returns Nurul to step 5
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
