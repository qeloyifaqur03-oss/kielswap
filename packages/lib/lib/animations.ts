/**
 * Shared animation transition configurations
 * Ensures consistent, smooth animations across all toggle interactions
 */

// Standard transition for all toggle interactions (dropdowns, accordions, etc.)
// Increased duration and softer easing for noticeably smoother feel
export const TOGGLE_TRANSITION = {
  duration: 0.35, // 350ms - noticeably smoother and slower
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // Softer ease-out curve
}

// Longer duration for height animations (which are more noticeable)
export const HEIGHT_TRANSITION = {
  duration: 0.40, // 400ms - extra smooth for height changes
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // Softer easing
}

// Standard dropdown animation values - updated to match new smoother timing
export const DROPDOWN_ANIMATION = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: TOGGLE_TRANSITION, // Now uses 350ms with softer easing
}

// Accordion inner content animation values
export const ACCORDION_CONTENT_ANIMATION = {
  initial: { y: -8, opacity: 0, scale: 0.98 },
  animate: { y: 0, opacity: 1, scale: 1 },
  exit: { y: -8, opacity: 0, scale: 0.98 },
  transition: TOGGLE_TRANSITION,
}

