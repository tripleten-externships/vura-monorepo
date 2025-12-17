import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/StoreContext';
import { OnboardingQuestionnaire } from '../components/OnboardingQuestionnaire';

/**
 * Demo page to showcase the questionnaire components
 * This page is independent of GraphQL and shows the questionnaire working locally
 * Updated to fix authentication and pointerEvents issues
 */
const QuestionnaireDemo: React.FC = observer(() => {
  const { onboardingStore } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Questionnaire Demo</Text>
        <Text style={styles.headerSubtitle}>
          This demonstrates the onboarding questionnaire components
        </Text>
        <Text style={styles.debugInfo}>
          Current Progress: {onboardingStore.completionPercentage}%
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <OnboardingQuestionnaire />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F6F4FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7E7',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#363636',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugInfo: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default QuestionnaireDemo;
