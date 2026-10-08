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

// ---------------------------------------------------------------- Phase 5: agency queues ↔ student app
const toAgency = async (role) => {
  await page.getByRole('button', { name: 'Demo' }).click()
  const sheet = page.getByRole('dialog', { name: 'Demo controls' })
  await sheet.getByLabel('Officer role').selectOption(role)
  await sheet.getByRole('tab', { name: 'Agency' }).click()
  await page.waitForTimeout(700)
}
const toStudent = async (who) => {
  if (new URL(page.url()).pathname.startsWith('/a/')) {
    await page.getByRole('tab', { name: 'Student' }).first().click()
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: 'Demo' }).click()
  await page.getByRole('button', { name: who }).click()
  await page.waitForTimeout(600)
}
await page.setViewportSize({ width: 1100, height: 900 })
await toStudent(/^MH Muhammad Hafiz/)
// Hafiz logs a new application that the AI escalates → it should reach the officer queue.
await page.getByRole('link', { name: 'Opportunities' }).or(page.getByRole('button', { name: 'Opportunities' })).first().click()
await page.waitForTimeout(500)
await page.getByRole('tab', { name: 'My job search log' }).click()
await page.getByRole('button', { name: 'Log an application', exact: true }).click()
await page.getByLabel('Role', { exact: true }).fill('Graduate Analyst')
await page.getByLabel('Company', { exact: true }).fill('Mega Jaya Ventures')
await btn('Next: add evidence').click()
await page.getByRole('button', { name: /Unfamiliar company/ }).click()
await page.waitForTimeout(3300)
check(await page.getByText('Sent to an officer').isVisible(), 'student escalation: sent to an officer')
await btn('Done').click()
await page.waitForTimeout(300)

await toAgency('programmeOfficer')
check((await page.getByText('48', { exact: true }).count()) > 0, 'agency home: evidence queue now shows 48 (47 + new escalation)')
await page.getByRole('button', { name: /Job search evidence/ }).click()
await page.waitForTimeout(600)
await page.getByRole('tab', { name: /Demo students/ }).click()
await page.waitForTimeout(300)
const demoRows = await page.locator('tbody tr').count()
check(demoRows === 3, `demo-student filter shows Hafiz ×2 + Kavitha (${demoRows})`)
await page.locator('tbody tr', { hasText: 'Syarikat Cahaya Timur Logistik' }).click()
await page.waitForTimeout(500)
await btn('Verify').click()
await page.waitForTimeout(600)
await page.locator('tbody tr', { hasText: 'Rekabina Elektrik' }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Reject with reason' }).last().click()
await page.getByRole('button', { name: 'Unreadable, please re-upload the original email' }).click()
await btn('Confirm').click()
await page.waitForTimeout(600)
check((await page.locator('tbody tr').count()) === 1, 'decided cases leave the queue')

// Partner role approval → live for students
await page.getByRole('link', { name: 'Partners' }).click()
await page.getByRole('link', { name: 'Role approvals' }).click()
await page.waitForTimeout(600)
await page.locator('article', { hasText: 'Planning Engineer' }).getByRole('button', { name: 'Approve role' }).click()
await page.waitForTimeout(600)
check((await page.locator('article', { hasText: 'Planning Engineer' }).count()) === 0, 'approved role leaves the approvals list')

// Undo from recent activity
await page.getByRole('link', { name: 'Home' }).click()
await page.waitForTimeout(600)
check((await page.getByRole('button', { name: 'Undo' }).count()) >= 3, 'session actions appear in recent activity with Undo')

// Leadership viewer is read-only
await page.getByLabel('Officer role').first().selectOption('leadershipViewer')
await page.waitForTimeout(400)
check((await page.getByRole('button', { name: 'Undo' }).count()) === 0, 'leadership viewer cannot undo')

// Back to the student app: decisions flowed back
await toStudent(/^MH Muhammad Hafiz/)
await page.getByRole('button', { name: 'Opportunities' }).first().click()
await page.waitForTimeout(400)
await page.getByRole('tab', { name: 'Partner roles' }).click()
await page.waitForTimeout(400)
check((await page.getByText('Planning Engineer').count()) > 0, 'approved partner role is live for students')
await page.getByRole('tab', { name: 'My job search log' }).click()
await page.waitForTimeout(400)
const cahaya = page.locator('button', { hasText: 'Graduate Planner' }).first()
check((await cahaya.innerText()).includes('Verified'), 'officer verification shows on the student log')
await toStudent(/^KR Kavitha/)
await page.getByRole('button', { name: 'Opportunities' }).first().click()
await page.getByRole('tab', { name: 'My job search log' }).click()
await page.waitForTimeout(400)
await page.locator('button', { hasText: 'Junior Electrical Designer' }).first().click()
await page.waitForTimeout(400)
check(await page.getByText('Unreadable, please re-upload the original email').isVisible(), 'officer rejection reason shows to the student')
await page.keyboard.press('Escape')

// ---------------------------------------------------------------- Phase 6: partners, students, AI governance, tiers
const asOfficer = async (role) => {
  await page.getByLabel('Officer role').first().selectOption(role)
  await page.waitForTimeout(500)
}
const nav = async (...names) => {
  for (const n of names) {
    await page.getByRole('link', { name: n, exact: true }).first().click()
    await page.waitForTimeout(500)
  }
}
const toast = (text) => page.getByText(text).first().isVisible()

// Pausing a partner hides its roles from students
await toAgency('partnershipManager')
await nav('Partners')
await page.locator('tbody tr', { hasText: 'Seri Mutiara' }).click()
await page.waitForTimeout(500)
await btn('Pause').click()
await page.getByRole('button', { name: 'Behind on committed roles' }).click()
await btn('Confirm').click()
await page.waitForTimeout(500)
check(await page.getByText('Paused: this partner’s roles are hidden from students.').isVisible(), 'paused partner shows the hidden-roles note')

// Portal feed → link-out is a programme setting
await nav('Portal feeds')
await page.locator('tbody tr', { hasText: 'KerjaKini' }).getByRole('tab', { name: 'Link-out' }).click()
await page.waitForTimeout(300)
check(await toast('Students now see KerjaKini as Link-out'), 'portal switched to link-out')

// Two-person rule on rubric changes
await asOfficer('aiGovernanceLead')
await nav('AI governance', 'Rubric changes')
await btn('Impact preview').click()
await page.waitForTimeout(300)
check(await page.getByText('Sample of 500 profiles').isVisible(), 'rubric impact preview over a 500-profile sample')
await btn('Submit for second approval').click()
await page.waitForTimeout(500)
check(await page.getByText('You drafted this change. Another officer must approve it').isVisible(), 'drafter cannot approve their own rubric change')
await asOfficer('superAdmin')
await btn('Approve and publish').click()
await page.waitForTimeout(600)
check((await page.getByText('Published', { exact: true }).count()) > 0, 'second officer approves and publishes')

// Skill dispute correction reaches Hafiz
await asOfficer('aiGovernanceLead')
await nav('Students', 'Skill disputes')
await page.locator('tbody tr', { hasText: 'Process improvement' }).filter({ hasText: 'demo' }).click()
await page.waitForTimeout(500)
await btn('Correct and re-score').click()
await page.waitForTimeout(600)
check((await page.locator('tbody tr', { hasText: 'Process improvement' }).filter({ hasText: 'demo' }).count()) === 0, 'resolved dispute leaves the list')

// Student record: masked until revealed, reveal is logged, repayment gated
await nav('Directory')
await page.locator('tbody tr', { hasText: 'S-24087' }).click()
await page.waitForTimeout(500)
check(await page.getByText('Name hidden').first().isVisible(), 'student record is masked by default')
check(await page.getByText('Repayment details are visible to the collection liaison and super admin only.').isVisible(), 'AI lead sees tier badge only (repayment gated)')
await btn('Reveal name and IC').click()
await page.getByRole('button', { name: 'Student called the helpline' }).click()
await btn('Confirm').click()
await page.waitForTimeout(400)
check(await page.getByText('Kavitha', { exact: false }).first().isVisible(), 'reveal shows the name')

// Tier rules: liaison drafts, super admin approves, settings apply
await asOfficer('collectionLiaison')
await nav('Repayment tiers')
await btn('Propose a change').click()
await page.waitForTimeout(400)
await page.getByRole('switch', { name: 'Grace period counts as' }).click()
check(await page.getByText('9,120').isVisible(), 'tier impact preview: 9,120 students A → B')
await btn('Submit for second approval').click()
await page.waitForTimeout(500)
await asOfficer('superAdmin')
await btn('Approve and publish').click()
await page.waitForTimeout(600)
check((await page.locator('tbody tr', { hasText: 'Grace period counts as' }).innerText()).includes('Tier B'), 'approved tier rule applies to settings')

// Override restores Kavitha's benefits
await asOfficer('collectionLiaison')
await nav('Overrides')
await page.locator('article', { hasText: 'OV-5101' }).getByRole('button', { name: /Grant 14 days/ }).click()
await page.getByRole('button', { name: 'Bank receipt checked against reference' }).click()
await btn('Confirm').click()
await page.waitForTimeout(500)
check((await page.locator('article', { hasText: 'OV-5101' }).innerText()).includes('Active'), 'override OV-5101 is active')

await toStudent(/^KR Kavitha/)
await page.getByRole('button', { name: /^Notifications/ }).first().click()
await page.waitForTimeout(500)
check(await page.getByText('Your benefits are back while your payment is confirmed.').isVisible(), 'Kavitha is notified of the override')
await toStudent(/^MH Muhammad Hafiz/)
await page.getByRole('button', { name: /^Notifications/ }).first().click()
await page.waitForTimeout(500)
check(await page.getByText('Your dispute was accepted').first().isVisible(), 'Hafiz is notified of the dispute correction')
await page.getByRole('button', { name: 'Opportunities' }).first().click()
await page.waitForTimeout(400)
await page.getByRole('tab', { name: 'Partner roles' }).click()
await page.waitForTimeout(400)
check((await page.getByText('Logistics Executive (Graduate)').count()) === 0, 'paused partner’s roles are hidden from students')

// ---------------------------------------------------------------- Phase 7: reports, settings, safety
await toAgency('learningManager')
await nav('Reports')
check((await page.getByText('Repayment impact').count()) === 0, 'learning manager does not see the Repayment impact report')
check((await page.getByText('Skills and learning').count()) > 0, 'learning manager sees Skills and learning')
await asOfficer('leadershipViewer')
await page.getByRole('button', { name: /Employment outcomes/ }).click()
await page.waitForTimeout(600)
const allKpi = await page.locator('dl').first().innerText()
await page.getByLabel('State').selectOption('Sabah')
await page.waitForTimeout(500)
check((await page.locator('dl').first().innerText()) !== allKpi, 'report filters change the headline numbers')
await btn('Export CSV').click()
await page.waitForTimeout(300)
check(await toast('Export ready · logged'), 'CSV export is logged')
await nav('Cohort view')
check(await page.getByText('Cohort 2025: share of graduates by month (%)').isVisible(), 'cohort view charts the 2025 cohort')

await asOfficer('superAdmin')
await nav('Settings')
await page.getByLabel('Active job-seeking threshold').fill('5')
await btn('Save changes').click()
await page.waitForTimeout(400)
check(await toast('Programme settings saved · logged'), 'programme settings save')
await page.getByRole('tab', { name: 'Audit log' }).click()
await page.getByPlaceholder('Search action, record, reason or officer').fill('programme settings')
await page.waitForTimeout(300)
check((await page.locator('tbody tr', { hasText: 'Changed programme settings' }).count()) > 0, 'settings change appears in the audit log')
await page.getByPlaceholder('Search action, record, reason or officer').fill('Revealed')
await page.waitForTimeout(300)
check((await page.locator('tbody tr', { hasText: 'Revealed student name and IC' }).count()) > 0, 'identity reveal appears in the audit log')
await page.getByRole('tab', { name: 'PDPA' }).click()
await page.waitForTimeout(400)
const dr = page.locator('tbody tr', { hasText: 'DR-3011' })
await dr.getByRole('button', { name: 'Remove from search' }).click()
await page.waitForTimeout(400)
check((await dr.innerText()).includes('Removed from search'), 'deletion step 1: removed from search')
await dr.getByRole('button', { name: 'Delete and anonymise' }).click()
await page.waitForTimeout(400)
check((await dr.innerText()).includes('Completed'), 'deletion step 2: completed')
await page.getByRole('tab', { name: 'Safety' }).click()
await page.waitForTimeout(300)
await page.getByRole('switch', { name: 'Pause all partner outreach' }).click()
await page.getByRole('button', { name: 'Scam reports from several students' }).click()
await btn('Confirm').click()
await page.waitForTimeout(400)
await btn('Send to all students').click()
await page.waitForTimeout(500)
check(await toast('Warning sent to all students · logged'), 'scam warning sent')

await toStudent(/^MH Muhammad Hafiz/)
await page.getByRole('button', { name: 'Opportunities' }).first().click()
await page.waitForTimeout(400)
await page.getByRole('tab', { name: 'Partner roles' }).click()
await page.waitForTimeout(400)
check(await page.getByText('Talent Partner outreach is paused for a safety check.', { exact: false }).isVisible(), 'kill switch shows a notice to students')
await page.getByRole('button', { name: /^Notifications/ }).first().click()
await page.waitForTimeout(500)
check(await page.getByText('never ask for fees', { exact: false }).first().isVisible(), 'student receives the scam warning')
await page.setViewportSize({ width: 390, height: 844 })

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
