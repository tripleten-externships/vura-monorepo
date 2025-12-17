/**
 * QUESTIONNAIRE COMPONENT NAVIGATION GUIDE
 *
 * This file explains how to find and understand each part of the questionnaire
 * so you can style it effectively without React Native experience.
 */

// QUESTIONNAIRE STRUCTURE OVERVIEW
// ================================

/*
The questionnaire is made up of several components working together:

📁 OnboardingQuestionnaire/ (Main container - controls the flow)
├── 📄 OnboardingQuestionnaire.tsx (Main logic and layout)
├── 📄 styles.ts (Your new styling system)
├── 📄 theme.ts (Colors, fonts, spacing)
└── 📄 responsive.ts (Different screen sizes)

📁 Individual Input Components/
├── 📁 RadioGroup/ (Single choice questions - like "Single Parent" vs "Two Parents")
├── 📁 NumberCarousel/ (Age picker with scrolling numbers)
├── 📁 QuestionnaireTextInput/ (Text input with special features)
└── 📁 CheckboxGroup/ (Multiple choice questions - like selecting challenges)
*/

// HOW TO FIND WHAT YOU'RE LOOKING FOR
// ===================================

export const componentLocations = {
  // Main questionnaire container and navigation
  mainContainer: 'src/components/OnboardingQuestionnaire/OnboardingQuestionnaire.tsx',

  // Progress dots at the top
  progressIndicator:
    'OnboardingQuestionnaire.tsx - lines 175-200 (renderProgressIndicator function)',

  // Next/Previous buttons at bottom
  navigationButtons: 'OnboardingQuestionnaire.tsx - lines 240-280 (navigation section)',

  // Header with title and subtitle
  header: 'OnboardingQuestionnaire.tsx - lines 160-175 OR your demo page',

  // Individual question components
  radioButtons: 'src/components/RadioGroup/RadioGroup.tsx',
  numberPicker: 'src/components/NumberCarousel/NumberCarousel.tsx',
  textInput: 'src/components/QuestionnaireTextInput/QuestionnaireTextInput.tsx',
  checkboxes: 'src/components/CheckboxGroup/CheckboxGroup.tsx',
};

// WHAT EACH COMPONENT LOOKS LIKE IN THE UI
// ========================================

export const componentDescriptions = {
  OnboardingQuestionnaire: {
    description: 'The main wrapper that contains everything',
    visualElements: [
      'Overall background color',
      'Layout and spacing between sections',
      'Step-by-step flow logic',
    ],
    whereToStyle: 'OnboardingQuestionnaire.tsx styles section',
  },

  RadioGroup: {
    description: 'Single-choice questions (only one option can be selected)',
    visualElements: [
      'Circle buttons with labels',
      'Selected vs unselected states',
      'Hover effects',
      'Description text under labels',
    ],
    whereToStyle: 'src/components/RadioGroup/RadioGroup.tsx styles section',
    exampleUse: 'Parent type question (One Parent vs Two Parents)',
  },

  NumberCarousel: {
    description: 'Scrollable number picker for age selection',
    visualElements: [
      'Scrollable list of numbers',
      'Center highlight indicator',
      'Selected number styling',
      'Background and borders',
    ],
    whereToStyle: 'src/components/NumberCarousel/NumberCarousel.tsx styles section',
    exampleUse: 'Child age selection',
  },

  QuestionnaireTextInput: {
    description: 'Enhanced text input field',
    visualElements: [
      'Input box border and background',
      'Placeholder text styling',
      'Focus states (when clicked)',
      'Character counter',
      'Clear button (X)',
    ],
    whereToStyle: 'src/components/QuestionnaireTextInput/QuestionnaireTextInput.tsx styles section',
    exampleUse: 'Child name or additional information',
  },

  CheckboxGroup: {
    description: 'Multiple-choice questions (can select many options)',
    visualElements: [
      'Square checkboxes with checkmarks',
      'Grid or list layout',
      'Selected vs unselected states',
      '"Select All" button',
      'Labels and descriptions',
    ],
    whereToStyle: 'src/components/CheckboxGroup/CheckboxGroup.tsx styles section',
    exampleUse: 'Challenges selection (Sleep Issues, Feeding Problems, etc.)',
  },

  ProgressIndicator: {
    description: 'Dots showing current step progress',
    visualElements: [
      'Dot size and colors',
      'Active vs inactive states',
      'Spacing between dots',
      'Numbers inside dots',
    ],
    whereToStyle: 'OnboardingQuestionnaire.tsx renderProgressIndicator function',
  },

  NavigationButtons: {
    description: 'Previous/Next buttons at bottom',
    visualElements: [
      'Button colors and borders',
      'Text styling',
      'Disabled states',
      'Button size and spacing',
      'Hover effects',
    ],
    whereToStyle: 'OnboardingQuestionnaire.tsx navigation section styles',
  },
};
