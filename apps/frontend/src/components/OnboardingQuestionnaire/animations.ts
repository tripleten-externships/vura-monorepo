import { Platform } from 'react-native';

/**
 * Animation configurations for smooth transitions
 * Customize timing and easing to match your design
 */

export const animations = {
  // Standard timing functions
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Step transitions (for questionnaire navigation)
  stepTransition: {
    duration: 300,
    easing: 'ease-in-out',
  },

  // Progress bar animations
  progressBar: {
    duration: 400,
    easing: 'ease-out',
  },

  // Button interactions
  buttonPress: {
    duration: 100,
    scale: 0.98,
  },

  // Input focus states
  inputFocus: {
    duration: 200,
    easing: 'ease-out',
  },
};

// CSS transitions for web
export const webTransitions =
  Platform.OS === 'web'
    ? {
        // Smooth property transitions
        smooth: (properties: string[], duration = animations.timing.normal) => ({
          transition: properties
            .map((prop) => `${prop} ${duration}ms ${animations.easing.easeOut}`)
            .join(', '),
        }),

        // Transform animations
        transform: (duration = animations.timing.normal) => ({
          transition: `transform ${duration}ms ${animations.easing.easeOut}`,
        }),

        // Opacity fades
        fade: (duration = animations.timing.normal) => ({
          transition: `opacity ${duration}ms ${animations.easing.easeOut}`,
        }),

        // All properties
        all: (duration = animations.timing.normal) => ({
          transition: `all ${duration}ms ${animations.easing.easeOut}`,
        }),
      }
    : {};

// Hover effects for web
export const hoverEffects =
  Platform.OS === 'web'
    ? {
        // Scale on hover
        scale: {
          ':hover': {
            transform: 'scale(1.02)',
          },
        },

        // Lift effect
        lift: {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          },
        },

        // Brighten on hover
        brighten: {
          ':hover': {
            opacity: 0.8,
          },
        },

        // Border highlight
        borderHighlight: (color: string) => ({
          ':hover': {
            borderColor: color,
          },
        }),
      }
    : {};
