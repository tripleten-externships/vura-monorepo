/**
 * QUESTIONNAIRE STYLING IMPLEMENTATION GUIDE
 *
 * This guide provides different approaches to customize the questionnaire
 * based on your design requirements and NDA constraints.
 */

// APPROACH 1: Theme-Based Customization
// =====================================
// Modify the theme.ts file to match your brand colors, spacing, and typography
// This provides consistent styling across all components

/*
import { defaultTheme } from './theme';

const myBrandTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#YOUR_PRIMARY_COLOR',
    secondary: '#YOUR_SECONDARY_COLOR',
    // ... other brand colors
  },
  // Customize other theme properties
};
*/

// APPROACH 2: Component-Level Customization
// =========================================
// Override specific component styles while keeping the structure

/*
// In your component file:
const customStyles = StyleSheet.create({
  ...questionnaireStyles,
  
  // Override specific styles
  container: {
    ...questionnaireStyles.container,
    backgroundColor: '#YOUR_BACKGROUND',
  },
  
  navButton: {
    ...questionnaireStyles.navButton,
    borderRadius: 25, // More rounded buttons
    height: 56, // Taller buttons
  },
});
*/

// APPROACH 3: Layout Variations
// =============================
// Different layout configurations for different design needs

export const layoutVariations = {
  // Centered narrow layout (good for mobile-first)
  centered: {
    maxWidth: 400,
    marginHorizontal: 'auto',
    padding: 24,
  },

  // Full-width layout (good for tablets/desktop)
  fullWidth: {
    width: '100%',
    padding: 32,
  },

  // Card-based layout (elevated appearance)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Split layout (form on left, info on right)
  split: {
    flexDirection: 'row',
    gap: 32,
  },
};

// APPROACH 4: Animation Presets
// =============================
// Pre-configured animations you can apply

export const animationPresets = {
  // Smooth slide transitions between steps
  slideTransition: {
    duration: 300,
    type: 'slide',
  },

  // Fade in/out between steps
  fadeTransition: {
    duration: 250,
    type: 'fade',
  },

  // Spring-based interactions
  springy: {
    damping: 15,
    stiffness: 150,
  },

  // Minimal, fast transitions
  snappy: {
    duration: 150,
    type: 'timing',
  },
};

// APPROACH 5: Responsive Breakpoints
// ==================================
// Customize how the questionnaire adapts to different screen sizes

export const responsiveConfig = {
  mobile: {
    containerPadding: 16,
    fontSize: 16,
    buttonHeight: 48,
    spacing: 16,
  },

  tablet: {
    containerPadding: 32,
    fontSize: 18,
    buttonHeight: 56,
    spacing: 24,
  },

  desktop: {
    containerPadding: 48,
    fontSize: 20,
    buttonHeight: 64,
    spacing: 32,
  },
};

// APPROACH 6: Accessibility Configurations
// =======================================
// Ensure your custom styles maintain accessibility

export const accessibilityStyles = {
  // High contrast mode
  highContrast: {
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      border: '#000000',
      text: '#000000',
      background: '#FFFFFF',
    },
  },

  // Large text mode
  largeText: {
    fontSizeMultiplier: 1.3,
    lineHeightMultiplier: 1.4,
    buttonHeightMultiplier: 1.2,
  },

  // Focus indicators
  focusRing: {
    borderWidth: 3,
    borderColor: '#007AFF',
    borderStyle: 'solid',
  },
};

// IMPLEMENTATION STEPS
// ===================

/*
1. Start with theme.ts - define your color palette, spacing, and typography
2. Use responsive.ts to ensure your design works across devices  
3. Apply animations.ts for smooth interactions
4. Create custom styles using the style generator
5. Test with different screen sizes and accessibility settings

Example implementation in your questionnaire component:

import { createQuestionnaireStyles } from './styles';
import { myCustomTheme } from './theme';

const MyQuestionnaire = () => {
  const styles = createQuestionnaireStyles(myCustomTheme);
  
  return (
    <View style={styles.container}>
      // Your questionnaire content
    </View>
  );
};
*/
