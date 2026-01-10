'use client'

import { useEffect, useState, useCallback } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

const ONBOARDING_STORAGE_KEY = 'kielswap_onboarding_v1_done'
const ACCESS_STORAGE_KEY = 'kielswap_access_granted'

const tourSteps: Step[] = [
  {
    target: '[data-tour="swap-main"]',
    title: 'Start with the amount',
    content: 'Enter what you pay and instantly see an estimated receive.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="swap-from"]',
    title: 'Choose origin',
    content: "Select the network and token you're swapping from.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="swap-to"]',
    title: 'Choose destination',
    content: 'Select the network and token you want to receive.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="swap-advanced"]',
    title: 'Advanced settings',
    content: 'Optional controls like MEV protection and execution preferences.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-badges"]',
    title: 'Your progress',
    content: 'Badges, referral progress, history, and feedback live in the app navigation.',
    disableBeacon: true,
  },
]

export function OnboardingTour() {
  const [run, setRun] = useState(false)

  // Check if tour should run on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if access is granted
    const accessGranted = sessionStorage.getItem(ACCESS_STORAGE_KEY) === '1'
    
    // Check if onboarding is already done
    const onboardingDone = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'

    // Run tour if access is granted and onboarding is not done
    if (accessGranted && !onboardingDone) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Mark onboarding as done
      if (typeof window !== 'undefined') {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
      }
      setRun(false)
    }
  }, [])

  const handleRestartTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY)
      // Small delay to ensure DOM is ready, especially if navigating between pages
      setTimeout(() => {
        setRun(true)
      }, 300)
    }
  }, [])

  // Expose restart function globally for the menu button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).restartOnboardingTour = handleRestartTour
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).restartOnboardingTour
      }
    }
  }, [handleRestartTour])

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: false,
      }}
      styles={{
        options: {
          primaryColor: 'rgba(196, 37, 88, 0.4)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '16px',
          background: 'rgba(18, 18, 22, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          color: '#ffffff',
          padding: '24px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 500,
          marginBottom: '8px',
        },
        tooltipContent: {
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '0',
        },
        buttonNext: {
          background: 'rgba(196, 37, 88, 0.4)',
          border: '1px solid rgba(196, 37, 88, 0.5)',
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 400,
          padding: '10px 20px',
          outline: 'none',
        },
        buttonBack: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          fontWeight: 400,
          padding: '10px 20px',
          outline: 'none',
        },
        buttonSkip: {
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          fontWeight: 400,
          padding: '10px 20px',
          outline: 'none',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        spotlight: {
          borderRadius: '16px',
          padding: '8px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Done',
        last: 'Done',
        next: 'Next',
        skip: 'Skip',
      }}
    />
  )
}

