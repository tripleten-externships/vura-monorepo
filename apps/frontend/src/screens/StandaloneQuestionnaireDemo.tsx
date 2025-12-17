import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/StoreContext';
import { OnboardingQuestionnaire } from '../components/OnboardingQuestionnaire';

/**
 * STANDALONE QUESTIONNAIRE DEMO
 *
 * Simple questionnaire demo without complex debug info that might cause errors
 */
const StandaloneQuestionnaireDemo: React.FC = observer(() => {
  const { onboardingStore } = useStore();

  // Simple error boundary to catch any issues
  try {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Simple Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Simple Questionnaire Demo</Text>
          <Text style={styles.subtitle}>
            Step {onboardingStore.currentStep} of {onboardingStore.totalSteps}
          </Text>
        </View>

        {/* Main Questionnaire Component */}
        <View style={styles.questionnaireContainer}>
          <OnboardingQuestionnaire />
        </View>
      </ScrollView>
    );
  } catch (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Error Loading Demo</Text>
        <Text style={styles.errorText}>Please try the Enhanced Demo instead: /enhanced-demo</Text>
        <Text style={styles.errorDetails}>
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    backgroundColor: '#F8F9FA',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 8,
  },

  instructions: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  progressInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },

  questionnaireContainer: {
    flex: 1,
    minHeight: 500,
  },

  debugSection: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },

  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },

  debugContent: {
    gap: 8,
  },

  debugItem: {
    fontSize: 14,
    color: '#BF360C',
    backgroundColor: '#FFF8E1',
    padding: 8,
    borderRadius: 4,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFF5F5',
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E53E3E',
    marginBottom: 16,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#C53030',
    textAlign: 'center',
    marginBottom: 12,
  },

  errorDetails: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default StandaloneQuestionnaireDemo;
