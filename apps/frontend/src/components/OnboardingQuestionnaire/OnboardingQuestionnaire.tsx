import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store/StoreContext';
import {
  RadioGroup,
  NumberCarousel,
  QuestionnaireTextInput,
  CheckboxGroup,
  type RadioOption,
  type CheckboxOption,
} from '../index';
// TEMPORARY: Debug helper to identify UI sections
import {
  DebugHeader,
  DebugProgress,
  DebugStepContent,
  DebugNavigation,
  DebugRadioGroup,
  DebugCheckboxGroup,
  DebugNumberCarousel,
  DebugTextInput,
} from './DebugHelper';

/**
 * Complete onboarding questionnaire component that demonstrates
 * all questionnaire UI components working with MobX state management
 */
export const OnboardingQuestionnaire: React.FC = observer(() => {
  const { onboardingStore } = useStore();
  const { responses, currentStep, errors } = onboardingStore;

  // Sample data for different steps
  const parentTypeOptions: RadioOption[] = [
    {
      value: 'one-parent',
      label: 'One parent',
      description: 'I take care of one parent',
    },
    {
      value: 'two-parents',
      label: 'Two parents',
      description: 'I take care of two parents',
    },
  ];

  const healthConditionOptions: CheckboxOption[] = [
    {
      value: 'condition-1',
      label: 'Condition 1',
    },
    {
      value: 'condition-2',
      label: 'Condition 2',
    },
  ];

  const challengeOptions: RadioOption[] = [
    {
      value: 'lack-of-time',
      label: 'Lack of time',
    },
    {
      value: 'lack-of-elder-care-knowledge',
      label: 'Lack of elder care knowledge',
    },
    {
      value: 'mental-stress',
      label: 'Mental Stress',
    },
    {
      value: 'lack-of-finances',
      label: 'Lack of finances',
    },
    {
      value: 'other',
      label: 'Other, please write',
    },
  ];

  // Navigation handlers
  const handleNext = () => {
    if (onboardingStore.validateCurrentStep()) {
      onboardingStore.nextStep();
    }
  };

  const handlePrevious = () => {
    onboardingStore.previousStep();
  };

  const handleStepSelect = (step: number) => {
    onboardingStore.goToStep(step);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <RadioGroup
            title="Do you take care of one or two parents?"
            options={parentTypeOptions}
            selectedValue={responses.parentType}
            onSelectionChange={(value) =>
              onboardingStore.setParentType(value as 'one-parent' | 'two-parents')
            }
            errorMessage={errors.parentType}
          />
        );

      case 2:
        return (
          <NumberCarousel
            title="How old
is your parent?"
            minValue={50}
            maxValue={100}
            selectedValue={responses.parentAge}
            onValueChange={onboardingStore.setParentAge}
            suffix=" years"
            errorMessage={errors.parentAge}
          />
        );

      case 3:
        return (
          <QuestionnaireTextInput
            title="Does your parent have any health conditions?"
            placeholder="Write here"
            value={responses.healthConditionsText}
            onChangeText={(text) => onboardingStore.setHealthConditionsText(text)}
            errorMessage={errors.healthConditionsText}
          />
        );

      // TEMPORARILY REMOVED: Step 4 - Health conditions checkbox
      // case 4:
      //   return (
      //     <CheckboxGroup
      //       title="Does your parent have any health conditions?"
      //       options={healthConditionOptions}
      //       selectedValues={responses.healthConditions}
      //       onSelectionChange={onboardingStore.toggleHealthCondition}
      //       errorMessage={errors.healthConditions}
      //     />
      //   );

      case 4: // Was case 5 - Challenges (shifted up due to removed step)
        return (
          <View>
            <RadioGroup
              title="Do you face any of these challenges?"
              options={challengeOptions}
              selectedValue={responses.selectedChallenge}
              onSelectionChange={(challenge) => onboardingStore.setSelectedChallenge(challenge)}
              errorMessage={errors.selectedChallenge}
              otherTextValue={responses.otherChallengeText}
              onOtherTextChange={(text) => onboardingStore.setOtherChallengeText(text)}
            />
          </View>
        );

      case 5: // Was case 6 - User age (shifted up due to removed step)
        return (
          <NumberCarousel
            title="What is your age?"
            minValue={18}
            maxValue={80}
            selectedValue={responses.userAge}
            onValueChange={onboardingStore.setUserAge}
            suffix=" years"
            errorMessage={errors.userAge}
          />
        );

      default:
        return (
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>Thank you!</Text>
            <Text style={styles.completionText}>Your responses have been recorded.</Text>
          </View>
        );
    }
  };

  // Step navigation dots
  const renderStepDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: onboardingStore.totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <TouchableOpacity
              key={stepNumber}
              style={[styles.dot, isActive && styles.dotActive, isCompleted && styles.dotCompleted]}
              onPress={() => handleStepSelect(stepNumber)}
              accessibilityRole="button"
              accessibilityLabel={`Go to step ${stepNumber}`}
            >
              <Text style={[styles.dotText, (isActive || isCompleted) && styles.dotTextActive]}>
                {stepNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Main content area - no scrolling, fills available space */}
      <View style={styles.contentContainer}>
        <View style={styles.stepContainer}>{renderStepContent()}</View>
      </View>

      {/* Single bottom button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={
            currentStep === onboardingStore.totalSteps ? 'Complete questionnaire' : 'Next step'
          }
        >
          <Text style={styles.bottomButtonText}>
            {currentStep === onboardingStore.totalSteps ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 8,
    height: 8,
  },
  dotCompleted: {
    backgroundColor: '#007AFF',
    width: 8,
    height: 8,
  },
  dotText: {
    display: 'none', // Hide numbers, use dots only like iOS
  },
  dotTextActive: {
    display: 'none',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34, // iOS safe area bottom padding
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  bottomButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },

  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#363636',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OnboardingQuestionnaire;
