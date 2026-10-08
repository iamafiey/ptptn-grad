# PTPTN Graduate Platform — Demo script (about 12 minutes)

A timed walkthrough of the clickable prototype: three students, then the agency side, then the round trip back to the students. All data is fictional and nothing is saved.

## Before you start (1 minute, off-stage)

- Open the app at the root URL on a laptop at 1280px or wider. The student app shows as a phone-width column, with Demo controls available.
- Open **Demo → Reset demo**. Language **English**, Appearance **Device** (or **Light** on a projector).
- **Don't reload the page during the demo.** A reload reseeds the demo data (by design); navigate in-app instead. If something goes wrong, **Demo → Reset demo** starts over.
- **Demo** (top right of the student app) switches student, workspace and language. In the agency workspace, the header has the officer-role picker, the Student | Agency toggle, BM/EN and a light/dark button.

---

## 1. Nurul: first-time onboarding and the AI skill reveal (2:30)

*Story: a final-year student turns activities she never thought of as "experience" into a verified skill profile.*

1. **Demo → Nurul Aina**. She resumes onboarding at step 5, *Activities*.
2. Tap **Add another → Fill with an example → Save activity**. The example is "Exco logistik" for a university event.
3. **Continue** → choose **Marketing** → **Continue**. The AI translation runs (about 4 seconds).
4. The reveal shows **"We found N skills"**. Point out that each skill has a level, a confidence and a "why" with its source evidence.
   - Talking point: *the AI is deterministic and explainable. Every result carries a model and rubric version.*
5. **Review my skills**: tap **Hide** on one skill, and **This isn't right → Send for review** on another.
   - Talking point: *students can lower or hide a skill, never raise it. Disputes go to an officer.*
6. **Confirm my skills** → the **Exactly what employers see** preview.
   - Talking point: *no name, no IC, no repayment data, until she accepts contact.*
7. **Finish and go to Home**.

## 2. Hafiz: Talent Partner invitation, open jobs and the job search log (3:00)

*Story: a logistics graduate with two partners interested and an active job search.*

1. **Demo → Muhammad Hafiz**. The Home hero reads **"2 partners want to talk"**.
2. Tap the next step **"A Talent Partner wants to talk"** → the Seri Mutiara invitation, with why-you-match → **Accept and share profile → Share my profile**.
3. Close the sheet → **Open jobs** tab → open any job → **Apply on KerjaKini** (or LaluanKerjaya, depending on the job).
   - Talking point: *we link out to existing portals. No scraping. Feeds come only from portals with data agreements.*
4. **My job search log** → the new entry shows **Needs evidence** → **Add evidence → Confirmation email**. The AI checks it (about 3 seconds) and verifies it.
   - The monthly card now reads **Active job-seeking record: on track** (4 verified this month).
5. Optional (30 seconds): **Home → Close this gap** (Report writing) → open the course → **Enrol** → continue the 3 modules → **Complete course**. The skill is re-scored and new role matches appear.

## 3. Kavitha: Tier B with dignity (1:30)

*Story: an engineering graduate who missed a payment. She keeps her dignity on every screen.*

1. **Demo → Kavitha a/p Ramasamy**. Home says **"3 benefits are paused. Here's how to get them back."**
   - Talking point: *no amounts and no "arrears" on Home or on job screens. Job screens only know whether a role is unlocked, locked or hidden.*
2. **Opportunities**: newer partner roles show a lock and **Unlock with good standing**.
3. **Repayment**: this is the only student screen with amounts. Show **Ways back to good standing**. *Don't* simulate the sync; the agency will restore her in section 5.

## 4. Agency: command centre and the evidence queue (2:00)

*Story: officers handle the exceptions; the AI clears the routine.*

1. **Demo → Workspace: Agency**. The officer role is **Programme officer**.
2. The **Command centre** shows queues first, with SLA chips (the evidence queue has items overdue), a programme pulse, alerts and recent activity.
3. Open the **Job search evidence** queue → filter **Demo students** → open Hafiz's **Syarikat Cahaya Timur Logistik** case.
   - The evidence sits beside the student's entry and the AI's extraction, checks, confidence and model version.
   - **Verify**. Open **Rekabina Elektrik** (Kavitha) → **Reject with reason** → pick a reason → **Confirm**.
4. **Home → Undo** on a recent action shows that every action is logged and reversible within the session.

## 5. Agency: governance, the two-person rule and collections (2:30)

1. Officer role **Partnership manager** → **Partners → Talent Partners**. Commitments are tracked and flagged: *Behind on roles*, *Slow to respond*.
   - Open **Seri Mutiara → Pause** (reason: *Behind on committed roles*). Its roles disappear from students at once.
2. Officer role **AI governance lead** → **AI governance → Rubric changes → Impact preview**. The example rule shows 38 profiles going down, broken down by institution type and programme.
   - **Submit for second approval**. The drafter can't approve their own change.
   - Switch to **Super admin** → **Approve and publish**.
3. **Students → Skill disputes** → Hafiz's **Process improvement** → **Correct and re-score**. Hafiz is notified.
4. Officer role **Collection liaison** → **Collections → Overrides** → **OV-5101** (Kavitha's bank receipt) → **Grant 14 days** → **Confirm**.
   - Talking point: *repayment details are visible only to collections staff and the super admin. Other roles see a tier badge only.*

## 6. Back to the students: the round trip (0:45)

1. **Student** (header toggle) → **Demo → Kavitha** → the bell shows **"Your benefits are back while your payment is confirmed."** Her partner roles are unlocked.
2. **Demo → Hafiz** → the bell shows the dispute correction and the verified evidence. **Partner roles** no longer lists the paused partner's role.

## 7. Close: leadership view (0:45)

1. **Agency → Leadership viewer**. Everything is read-only.
2. **Reports → Employment outcomes**: headline numbers with change, placements by source, placement rate by cohort. Filter by cohort or state; **Export CSV / PDF**.
3. **Reports → Cohort view**: follow the 2025 cohort from visible to hired to repaying.
   - Closing line: *every student-facing promise has an agency control behind it, and every action is on the audit trail.*

---

## If you have more time

- **Collections and customer service** (about 2:00, start from a fresh Reset demo):
  1. Officer role **Collection liaison** → **Collections**. The overview shows on-time share, Watch and High counts, today's work, borrowers past due and a fairness check by institution type.
  2. **Borrowers → High risk → S-24087** (Kavitha). The early-warning panel explains the score: missed August payment, 53 days past due, job search 2 of 4. Talking point: *the score orders the work; it never changes a tier, and the student never sees it.*
  3. **Offer a way back → Request a restructured plan**.
  4. **Student → Demo → Kavitha → Repayment**: the offer appears under **From PTPTN**. **Talk to us → Request a callback → Request callback**.
  5. **Agency → Customer service agent → Collections → Service desk** → Kavitha's **Callback** case. The AI assist summarises the account and drafts a reply. **Use draft 1 → Send reply**, then **Resolve case**.
  6. **Student → Kavitha → Repayment → Accept → Demo: simulate sync confirmed**. She's back in good standing; in the agency her follow-up plan shows *On track: no follow-up plan*.
  7. **Collection liaison → Collections → Follow-up plans** → edit a plan → **Submit for approval**, then approve as **Super admin** (two-person rule).

- **Settings → Programme settings** (Super admin): every open decision from the specs is a live setting (SLAs, salary floor, retention, thresholds). Change one and save; it's audited.
- **Settings → Safety → Pause all partner outreach**: students see a notice on Partner roles. **Send to all students** sends a scam warning to every student's notifications.
- **Settings → Audit log**: search for "Revealed" after opening a student record and revealing the name.
- **Partners → Portal feeds**: switch KerjaKini to **Link-out**. Students get a curated link instead of feed listings.
- **Collections → Tier rules → Propose a change**: flip *Grace period counts as*, see 9,120 students move A → B, submit, then approve as Super admin.
- **BM**: every screen switches to Bahasa Melayu (Demo → Language, or **BM** in the agency header).
- **Dark mode**: Demo → Appearance → Dark, or the moon button in the agency header.
