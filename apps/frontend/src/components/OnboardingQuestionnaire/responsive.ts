import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// Screen type detection
export const getScreenType = () => {
  if (screenWidth < breakpoints.mobile) return 'mobile';
  if (screenWidth < breakpoints.tablet) return 'tablet';
  if (screenWidth < breakpoints.desktop) return 'desktop';
  return 'largeDesktop';
};

// Responsive utilities
export const responsive = {
  // Spacing that scales with screen size
  spacing: (base: number) => {
    const screenType = getScreenType();
    const multiplier = {
      mobile: 1,
      tablet: 1.2,
      desktop: 1.4,
      largeDesktop: 1.6,
    }[screenType];

    return base * multiplier;
  },

  // Font sizes that scale
  fontSize: (base: number) => {
    const screenType = getScreenType();
    const multiplier = {
      mobile: 1,
      tablet: 1.1,
      desktop: 1.2,
      largeDesktop: 1.3,
    }[screenType];

    return Math.round(base * multiplier);
  },

  // Layout dimensions
  maxWidth: () => {
    const screenType = getScreenType();
    return {
      mobile: '100%',
      tablet: 600,
      desktop: 800,
      largeDesktop: 900,
    }[screenType];
  },

  // Padding for containers
  containerPadding: () => {
    const screenType = getScreenType();
    return {
      mobile: 16,
      tablet: 24,
      desktop: 32,
      largeDesktop: 40,
    }[screenType];
  },

  // Grid columns for checkbox groups
  gridColumns: () => {
    const screenType = getScreenType();
    return {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      largeDesktop: 3,
    }[screenType];
  },
};

// Platform-specific styles
export const platformStyles = {
  // Web-specific optimizations
  web:
    Platform.OS === 'web'
      ? {
          userSelect: 'none' as const,
          cursor: 'default' as const,
          outline: 'none' as const,
        }
      : {},

  // Interactive elements for web
  interactive:
    Platform.OS === 'web'
      ? {
          cursor: 'pointer' as const,
          transition: 'all 0.2s ease' as const,
        }
      : {},

  // Focus states for web accessibility
  focusable:
    Platform.OS === 'web'
      ? {
          ':focus': {
            outline: '2px solid #007AFF',
            outlineOffset: '2px',
          },
        }
      : {},
};
