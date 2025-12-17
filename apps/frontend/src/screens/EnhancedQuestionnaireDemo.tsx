import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/StoreContext';
import { OnboardingQuestionnaire } from '../components/OnboardingQuestionnaire';

/**
 * ENHANCED QUESTIONNAIRE DEMO WITH VALIDATION FEEDBACK
 *
 * This version shows clear validation feedback and progress information
 * to help with styling and debugging the questionnaire flow
 */
const EnhancedQuestionnaireDemo: React.FC = observer(() => {
  const { onboardingStore } = useStore();

  const getStepStatus = (step: number) => {
    if (step < onboardingStore.currentStep) return '✅';
    if (step === onboardingStore.currentStep) return '👉';
    return '⏸️';
  };

  const getStepName = (step: number) => {
    switch (step) {
      case 1:
        return 'Parent Type';
      case 2:
        return 'Parent Age';
      case 3:
        return 'Child Age';
      case 4:
        return 'Health Info';
      case 5:
        return 'Challenges';
      default:
        return `Step ${step}`;
    }
  };

  const hasValidationErrors = Object.keys(onboardingStore.errors).length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header with Clear Progress */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Enhanced Questionnaire Demo</Text>
        <Text style={styles.subtitle}>Fill out each step completely to proceed to the next</Text>

        {/* Step Overview */}
        <View style={styles.stepOverview}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} style={styles.stepItem}>
              <Text style={styles.stepStatus}>{getStepStatus(step)}</Text>
              <Text
                style={[
                  styles.stepName,
                  step === onboardingStore.currentStep && styles.stepNameActive,
                ]}
              >
                {getStepName(step)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Validation Alert */}
      {hasValidationErrors && (
        <View style={styles.validationAlert}>
          <Text style={styles.validationTitle}>⚠️ Please complete the current step:</Text>
          {Object.entries(onboardingStore.errors).map(([field, error]) => (
            <Text key={field} style={styles.validationError}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {/* Current Step Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          📝 Current Step: {getStepName(onboardingStore.currentStep)}
        </Text>
        <Text style={styles.instructionsText}>
          {onboardingStore.currentStep === 1 &&
            "Select whether you're a single parent or have a partner"}
          {onboardingStore.currentStep === 2 && 'Choose your age using the number picker (18-65)'}
          {onboardingStore.currentStep === 3 && "Select your child's age (0-18 years)"}
          {onboardingStore.currentStep === 4 &&
            "Enter health conditions or type 'None' if no conditions"}
          {onboardingStore.currentStep === 5 && "Select at least one challenge you're facing"}
        </Text>
      </View>

      {/* Main Questionnaire Component */}
      <View style={styles.questionnaireContainer}>
        <OnboardingQuestionnaire />
      </View>

      {/* Navigation Help */}
      <View style={styles.navHelp}>
        <Text style={styles.navHelpTitle}>🧭 Navigation Help</Text>
        <View style={styles.navHelpContent}>
          <Text style={styles.navHelpItem}>
            ⬅️ <Text style={styles.bold}>Back button:</Text> Go to previous step
          </Text>
          <Text style={styles.navHelpItem}>
            ➡️ <Text style={styles.bold}>Next button:</Text>{' '}
            {hasValidationErrors ? 'Complete current step first' : 'Proceed to next step'}
          </Text>
          <Text style={styles.navHelpItem}>
            🎯 <Text style={styles.bold}>Progress dots:</Text> Click to jump to any completed step
          </Text>
        </View>
      </View>

      {/* Current State Debug */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>📊 Current Responses</Text>
        <View style={styles.debugContent}>
          <Text style={styles.debugItem}>
            <Text style={styles.bold}>Parent Type:</Text>{' '}
            {onboardingStore.responses.parentType || 'Not selected'}
          </Text>
          <Text style={styles.debugItem}>
            <Text style={styles.bold}>Parent Age:</Text>{' '}
            {onboardingStore.responses.parentAge || 'Not selected'}
          </Text>
          <Text style={styles.debugItem}>
            <Text style={styles.bold}>Child Age:</Text>{' '}
            {onboardingStore.responses.userAge || 'Not selected'}
          </Text>
          <Text style={styles.debugItem}>
            <Text style={styles.bold}>Health Info:</Text>{' '}
            {onboardingStore.responses.healthConditions || 'Not entered'}
          </Text>
          <Text style={styles.debugItem}>
            <Text style={styles.bold}>Challenges:</Text>{' '}
            {onboardingStore.responses.challenges.length > 0
              ? `${onboardingStore.responses.challenges.length} selected`
              : 'None selected'}
          </Text>
        </View>
      </View>

      {/* Quick Reset Button */}
      <View style={styles.resetContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={() => onboardingStore.reset()}>
          <Text style={styles.resetButtonText}>🔄 Reset Questionnaire</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
  },

  stepOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },

  stepItem: {
    alignItems: 'center',
    flex: 1,
  },

  stepStatus: {
    fontSize: 20,
    marginBottom: 4,
  },

  stepName: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },

  stepNameActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  validationAlert: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },

  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },

  validationError: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
  },

  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },

  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },

  instructionsText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },

  questionnaireContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },

  navHelp: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },

  navHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0056B3',
    marginBottom: 12,
  },

  navHelpContent: {
    gap: 8,
  },

  navHelpItem: {
    fontSize: 14,
    color: '#003D82',
  },

  bold: {
    fontWeight: '600',
  },

  debugSection: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },

  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 12,
  },

  debugContent: {
    gap: 8,
  },

  debugItem: {
    fontSize: 14,
    color: '#E65100',
  },

  resetContainer: {
    padding: 16,
    alignItems: 'center',
  },

  resetButton: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedQuestionnaireDemo;
