import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  RadioGroup,
  NumberCarousel,
  QuestionnaireTextInput,
  CheckboxGroup,
  type RadioOption,
  type CheckboxOption,
} from '../components';

/**
 * INDIVIDUAL COMPONENT DEMOS
 *
 * This page shows each questionnaire component separately
 * Perfect for styling individual components without distractions
 */
const ComponentDemos: React.FC = () => {
  // State for each component demo
  const [selectedParentType, setSelectedParentType] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [childName, setChildName] = useState('');
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [currentDemo, setCurrentDemo] = useState<string>('radio');

  // Sample data
  const parentTypeOptions: RadioOption[] = [
    {
      value: 'one-parent',
      label: 'Single Parent',
      description: 'I am raising my child/children on my own',
    },
    {
      value: 'two-parents',
      label: 'Two Parents',
      description: 'I am co-parenting with a partner',
    },
  ];

  const challengeOptions: CheckboxOption[] = [
    {
      value: 'sleep-issues',
      label: 'Sleep Issues',
      description: 'Difficulty with sleep routines or night wakings',
    },
    {
      value: 'feeding-problems',
      label: 'Feeding Problems',
      description: 'Challenges with eating, nutrition, or feeding',
    },
    {
      value: 'behavioral-concerns',
      label: 'Behavioral Concerns',
      description: 'Managing tantrums, discipline, or behavioral issues',
    },
    {
      value: 'developmental-delays',
      label: 'Developmental Delays',
      description: 'Concerns about milestones or development progress',
    },
    {
      value: 'screen-time',
      label: 'Screen Time Management',
      description: 'Balancing technology use and screen time limits',
    },
    {
      value: 'social-skills',
      label: 'Social Skills',
      description: 'Help with making friends and social interactions',
    },
  ];

  const demoSections = [
    { key: 'radio', title: '🔘 Radio Group', description: 'Single choice selection' },
    { key: 'number', title: '🔢 Number Carousel', description: 'Age picker component' },
    { key: 'text', title: '📝 Text Input', description: 'Enhanced text input field' },
    { key: 'checkbox', title: '☑️ Checkbox Group', description: 'Multiple choice selection' },
  ];

  const renderDemo = () => {
    switch (currentDemo) {
      case 'radio':
        return (
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Radio Group Component</Text>
            <Text style={styles.demoDescription}>
              Used for single-choice questions. Try selecting different options.
            </Text>
            <RadioGroup
              title="What type of parent are you?"
              options={parentTypeOptions}
              selectedValue={selectedParentType}
              onSelectionChange={setSelectedParentType}
              errorMessage={null}
            />
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Selected: {selectedParentType || 'Nothing selected'}
              </Text>
            </View>
          </View>
        );

      case 'number':
        return (
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Number Carousel Component</Text>
            <Text style={styles.demoDescription}>
              Used for number selection. Scroll or click to select an age.
            </Text>
            <NumberCarousel
              title="How old is your child?"
              minValue={0}
              maxValue={18}
              selectedValue={selectedAge}
              onValueChange={setSelectedAge}
              suffix=" years old"
              errorMessage={null}
            />
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Selected: {selectedAge !== null ? `${selectedAge} years old` : 'Nothing selected'}
              </Text>
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Text Input Component</Text>
            <Text style={styles.demoDescription}>
              Enhanced text input with focus states and character counter.
            </Text>
            <QuestionnaireTextInput
              title="What is your child's name?"
              placeholder="Enter your child's name"
              value={childName}
              onChangeText={setChildName}
              maxLength={50}
              errorMessage={null}
            />
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>Entered: {childName || 'Nothing entered'}</Text>
            </View>
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Checkbox Group Component</Text>
            <Text style={styles.demoDescription}>
              Used for multiple-choice questions. Select as many as needed.
            </Text>
            <CheckboxGroup
              title="What challenges are you facing?"
              options={challengeOptions}
              selectedValues={selectedChallenges}
              onSelectionChange={setSelectedChallenges}
              maxSelections={6}
              allowSelectAll={true}
              layout="vertical"
              errorMessage={null}
            />
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                Selected ({selectedChallenges.length}):{' '}
                {selectedChallenges.length > 0 ? selectedChallenges.join(', ') : 'Nothing selected'}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧩 Component Demos</Text>
        <Text style={styles.subtitle}>Style each questionnaire component individually</Text>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.navButtons}>
            {demoSections.map((section) => (
              <TouchableOpacity
                key={section.key}
                style={[styles.navButton, currentDemo === section.key && styles.navButtonActive]}
                onPress={() => setCurrentDemo(section.key)}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    currentDemo === section.key && styles.navButtonTextActive,
                  ]}
                >
                  {section.title}
                </Text>
                <Text
                  style={[
                    styles.navButtonDesc,
                    currentDemo === section.key && styles.navButtonDescActive,
                  ]}
                >
                  {section.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Demo Content */}
      <View style={styles.content}>{renderDemo()}</View>

      {/* Styling Tips */}
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>💡 Styling Tips</Text>
        <Text style={styles.tipText}>• Each component has its own file in src/components/</Text>
        <Text style={styles.tipText}>• Look for StyleSheet.create at the bottom of each file</Text>
        <Text style={styles.tipText}>• Use browser dev tools (F12) to inspect elements</Text>
        <Text style={styles.tipText}>• Changes save automatically with hot reload</Text>
      </View>
    </ScrollView>
  );
};

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
    borderBottomColor: '#DEE2E6',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },

  navigation: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },

  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },

  navButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    minWidth: 160,
    alignItems: 'center',
  },

  navButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },

  navButtonTextActive: {
    color: '#FFFFFF',
  },

  navButtonDesc: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },

  navButtonDescActive: {
    color: '#E3F2FD',
  },

  content: {
    flex: 1,
    padding: 24,
  },

  demoSection: {
    gap: 16,
  },

  demoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },

  demoDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },

  resultBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },

  resultText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },

  tips: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },

  tipText: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 6,
  },
});

export default ComponentDemos;
