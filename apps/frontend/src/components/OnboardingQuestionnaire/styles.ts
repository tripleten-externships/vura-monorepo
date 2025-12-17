import { StyleSheet, Platform } from 'react-native';
import { defaultTheme, QuestionnaireTheme } from './theme';
import { responsive, platformStyles } from './responsive';
import { webTransitions, hoverEffects } from './animations';

/**
 * Customizable style generator for the questionnaire components
 * Pass different theme objects to completely change the appearance
 */

export const createQuestionnaireStyles = (theme: QuestionnaireTheme = defaultTheme) => {
  return StyleSheet.create({
    // Main container styles
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      ...platformStyles.web,
    },

    // Header customization
    header: {
      paddingHorizontal: responsive.containerPadding(),
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.default,
      alignItems: 'center' as const,
      ...webTransitions.smooth(['background-color', 'border-color']),
    },

    headerTitle: {
      fontSize: responsive.fontSize(theme.typography.fontSize.xl),
      fontWeight: '700' as const,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center' as const,
    },

    headerSubtitle: {
      fontSize: responsive.fontSize(theme.typography.fontSize.md),
      color: theme.colors.text.secondary,
      textAlign: 'center' as const,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    },

    // Progress indicator customization
    progressContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: responsive.containerPadding(),
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.sm,
    },

    progressDot: {
      width: 12,
      height: 12,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.layout.progressBar.trackColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(webTransitions.smooth?.(['background-color', 'transform']) || {}),
      ...(Platform.OS === 'web' ? hoverEffects.scale : {}),
    },

    progressDotActive: {
      backgroundColor: theme.layout.progressBar.fillColor,
      transform: [{ scale: 1.2 }],
    },

    progressDotCompleted: {
      backgroundColor: theme.colors.status.success,
    },

    // Step content area
    stepContainer: {
      flex: 1,
      padding: responsive.containerPadding(),
      minHeight: 400,
      justifyContent: 'space-between' as const,
    },

    stepTitle: {
      fontSize: responsive.fontSize(theme.typography.fontSize.lg),
      fontWeight: '600' as const,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center' as const,
    },

    stepDescription: {
      fontSize: responsive.fontSize(theme.typography.fontSize.md),
      color: theme.colors.text.secondary,
      textAlign: 'center' as const,
      marginBottom: theme.spacing.xl,
      lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    },

    // Navigation customization
    navigationContainer: {
      flexDirection: 'row' as const,
      padding: responsive.containerPadding(),
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.default,
    },

    navButton: {
      flex: 1,
      height: theme.layout.buttons.height,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: theme.layout.buttons.minWidth,
      ...webTransitions.smooth(['background-color', 'border-color', 'transform']),
      ...platformStyles.interactive,
    },

    backButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      ...(Platform.OS === 'web'
        ? {
            ':hover': {
              backgroundColor: theme.colors.surface,
              transform: 'translateY(-1px)',
            },
          }
        : {}),
    },

    nextButton: {
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      ...(Platform.OS === 'web' ? hoverEffects.lift : {}),
    },

    navButtonDisabled: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border.default,
      ...(Platform.OS === 'web'
        ? {
            cursor: 'not-allowed' as const,
          }
        : {}),
    },

    navButtonText: {
      fontSize: responsive.fontSize(theme.typography.fontSize.md),
      fontWeight: '600' as const,
    },

    backButtonText: {
      color: theme.colors.primary,
    },

    nextButtonText: {
      color: theme.colors.text.inverse,
    },

    navButtonTextDisabled: {
      color: theme.colors.text.disabled,
    },

    // Error states
    errorContainer: {
      backgroundColor: theme.colors.status.error,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.sm,
    },

    errorText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize(theme.typography.fontSize.sm),
      textAlign: 'center' as const,
    },

    // Success states
    successContainer: {
      backgroundColor: theme.colors.status.success,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.sm,
    },

    successText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize(theme.typography.fontSize.sm),
      textAlign: 'center' as const,
    },
  });
};

// Pre-configured style variations
export const questionnaireStyles = createQuestionnaireStyles();
export const modernQuestionnaireStyles = createQuestionnaireStyles(theme);
export const minimalQuestionnaireStyles = createQuestionnaireStyles(minimalTheme);
