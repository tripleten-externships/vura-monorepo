/**
 * Example usage of all questionnaire UI components
 * This file demonstrates how to use each component individually
 * and how they integrate with MobX state management
 */

import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/StoreContext';
import {
  RadioGroup,
  NumberCarousel,
  QuestionnaireTextInput,
  CheckboxGroup,
  type RadioOption,
  type CheckboxOption,
} from '../components';

// Sample data for demonstrations
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
];

export const QuestionnaireComponentExamples: React.FC = observer(() => {
  const { onboardingStore } = useStore();
  const { responses } = onboardingStore;

  return (
    <View style={{ padding: 20 }}>
      {/* Radio Group Example */}
      <RadioGroup
        title="What type of household do you have?"
        options={parentTypeOptions}
        selectedValue={responses.parentType}
        onSelectionChange={(value) =>
          onboardingStore.setParentType(value as 'one-parent' | 'two-parents')
        }
      />

      {/* Number Carousel Example - Parent Age */}
      <NumberCarousel
        title="What is your age?"
        minValue={18}
        maxValue={65}
        selectedValue={responses.parentAge}
        onValueChange={onboardingStore.setParentAge}
        suffix=" years"
      />

      {/* Number Carousel Example - Child Age */}
      <NumberCarousel
        title="What is your child's age?"
        minValue={0}
        maxValue={18}
        selectedValue={responses.userAge}
        onValueChange={onboardingStore.setUserAge}
        suffix=" years old"
        step={1}
      />

      {/* Text Input Example */}
      <QuestionnaireTextInput
        title="Health Conditions"
        value={responses.healthConditions}
        onChangeText={onboardingStore.setHealthConditions}
        placeholder="Describe any health conditions, allergies, or concerns..."
        maxLength={500}
        showCharacterCount={true}
        multiline={true}
      />

      {/* Checkbox Group Example - Vertical Layout */}
      <CheckboxGroup
        title="What challenges are you facing? (Vertical)"
        options={challengeOptions}
        selectedValues={responses.challenges}
        onSelectionChange={onboardingStore.toggleChallenge}
        minSelections={1}
        maxSelections={3}
        allowSelectAll={true}
        layout="vertical"
      />

      {/* Checkbox Group Example - Grid Layout */}
      <CheckboxGroup
        title="What challenges are you facing? (Grid)"
        options={challengeOptions}
        selectedValues={responses.challenges}
        onSelectionChange={onboardingStore.toggleChallenge}
        layout="grid"
        columns={2}
      />
    </View>
  );
});

/**
 * Usage Examples for Individual Components:
 *
 * 1. RADIO GROUP - Single Selection
 * ================================
 * const [selectedParentType, setSelectedParentType] = useState<string | null>(null);
 *
 * <RadioGroup
 *   title="Household Type"
 *   options={parentTypeOptions}
 *   selectedValue={selectedParentType}
 *   onSelectionChange={setSelectedParentType}
 *   errorMessage={errors.parentType}
 *   disabled={false}
 * />
 *
 *
 * 2. NUMBER CAROUSEL - Age Selection
 * =================================
 * const [age, setAge] = useState<number | null>(null);
 *
 * <NumberCarousel
 *   title="Select Your Age"
 *   minValue={18}
 *   maxValue={65}
 *   selectedValue={age}
 *   onValueChange={setAge}
 *   suffix=" years"
 *   step={1}
 *   errorMessage={errors.age}
 *   disabled={false}
 * />
 *
 *
 * 3. TEXT INPUT - Health Conditions
 * ================================
 * const [healthText, setHealthText] = useState('');
 *
 * <QuestionnaireTextInput
 *   title="Health Information"
 *   value={healthText}
 *   onChangeText={setHealthText}
 *   placeholder="Enter health conditions..."
 *   maxLength={500}
 *   multiline={true}
 *   showCharacterCount={true}
 *   errorMessage={errors.health}
 *   autoFocus={false}
 *   keyboardType="default"
 * />
 *
 *
 * 4. CHECKBOX GROUP - Multiple Selection
 * =====================================
 * const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
 *
 * const handleChallengeToggle = (value: string) => {
 *   setSelectedChallenges(prev =>
 *     prev.includes(value)
 *       ? prev.filter(item => item !== value)
 *       : [...prev, value]
 *   );
 * };
 *
 * <CheckboxGroup
 *   title="Select Challenges"
 *   options={challengeOptions}
 *   selectedValues={selectedChallenges}
 *   onSelectionChange={handleChallengeToggle}
 *   minSelections={1}
 *   maxSelections={5}
 *   allowSelectAll={true}
 *   layout="vertical" // or "grid"
 *   columns={2} // for grid layout
 *   errorMessage={errors.challenges}
 *   disabled={false}
 * />
 *
 *
 * MOBX INTEGRATION:
 * ================
 * All components are designed to work seamlessly with MobX stores:
 *
 * - Use `observer` HOC to make components reactive
 * - Pass store actions directly to component callbacks
 * - State persists automatically through MobX observables
 * - No manual state management required
 *
 * Example with MobX:
 * const { onboardingStore } = useStore();
 *
 * <RadioGroup
 *   selectedValue={onboardingStore.responses.parentType}
 *   onSelectionChange={onboardingStore.setParentType}
 * />
 *
 * The components will automatically re-render when MobX observables change!
 */
