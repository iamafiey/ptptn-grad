import { useCallback, useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { hasSkills, setOnboardingStep } from '@/services/students'
import type { OnboardingStep as Step } from '@/types/domain'
import { useStudent } from '../useStudent'
import { ONBOARDING_STEPS } from './steps'
import { AcademicStep } from './steps/AcademicStep'
import { ActivitiesStep } from './steps/ActivitiesStep'
import { ConfirmStep } from './steps/ConfirmStep'
import { ConsentStep } from './steps/ConsentStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { RevealStep } from './steps/RevealStep'
import { ReviewStep } from './steps/ReviewStep'
import { SignInStep } from './steps/SignInStep'
import { TranslatingStep } from './steps/TranslatingStep'
import { VisibleStep } from './steps/VisibleStep'
import type { StepProps } from './steps/types'

const COMPONENTS: Record<string, (p: StepProps) => React.ReactNode> = {
  signin: SignInStep,
  consent: ConsentStep,
  confirm: ConfirmStep,
  academic: AcademicStep,
  activities: ActivitiesStep,
  preferences: PreferencesStep,
  translating: TranslatingStep,
  reveal: RevealStep,
  review: ReviewStep,
  visible: VisibleStep,
}

const ORDER = ONBOARDING_STEPS.map((s) => s.id)

/** Routes /s/onboarding/:step to its screen and records progress as the student moves forward. */
export default function OnboardingStep() {
  const { step = 'signin' } = useParams()
  const navigate = useNavigate()
  const { id, data } = useStudent()
  const index = ORDER.indexOf(step)

  const goTo = useCallback((s: string) => navigate(`/s/onboarding/${s}`), [navigate])
  const next = useCallback(async () => {
    const nextId = ORDER[index + 1]
    if (!nextId) {
      await setOnboardingStep(id, 'done')
      navigate('/s/home')
      return
    }
    navigate(`/s/onboarding/${nextId}`)
  }, [id, index, navigate])

  // Record the furthest step reached (never move a finished student back).
  useEffect(() => {
    if (!data || index < 0) return
    const cur = data.student.onboardingStep
    if (cur === 'done') return
    if (ORDER.indexOf(cur) < index) setOnboardingStep(id, step as Step)
  }, [data, id, index, step])

  if (index < 0) return <Navigate to="/s/onboarding/signin" replace />
  // Reveal and review need skills; send the student through translation first.
  if ((step === 'reveal' || step === 'review' || step === 'visible') && !hasSkills(id)) return <Navigate to="/s/onboarding/translating" replace />
  // Wait for the hook to catch up with the store after the translation write.
  if (!data || ((step === 'reveal' || step === 'review') && !data.skills)) return <div className="min-h-dvh" aria-busy />

  const Comp = COMPONENTS[step]
  return <Comp key={step} state={data} next={next} goTo={goTo} />
}
