/**
 * STEP-BY-STEP NAVIGATION GUIDE FOR STYLING
 *
 * Follow these steps to understand and style each part of the questionnaire
 */

// STEP 1: IDENTIFY THE MAIN SECTIONS
// ==================================

/*
Open your browser to: http://localhost:3001/questionnaire-demo

You should see these main sections (top to bottom):
1. HEADER - Title and description at the top
2. PROGRESS DOTS - Small circles showing which step you're on  
3. QUESTION AREA - The actual form inputs
4. NAVIGATION BUTTONS - Previous/Next buttons at bottom
*/

// STEP 2: EXPLORE THE MAIN CONTAINER
// ==================================

/*
File: src/components/OnboardingQuestionnaire/OnboardingQuestionnaire.tsx

Look for this section (around line 155-170):
```
return (
  <View style={styles.container}>     <-- THIS controls the overall background and layout
    <View style={styles.header}>      <-- THIS controls the header area
```

To change the background color:
1. Find the `styles.container` definition at the bottom of the file
2. Change the `backgroundColor` property
*/

export const stylingLocations = {
  // Overall questionnaire appearance
  mainBackground: {
    file: 'OnboardingQuestionnaire.tsx',
    styleName: 'container',
    controls: 'Overall background color, main layout',
  },

  // Header section
  headerSection: {
    file: 'OnboardingQuestionnaire.tsx',
    styleName: 'header',
    controls: 'Title area background, spacing',
  },

  // Progress indicator
  progressDots: {
    file: 'OnboardingQuestionnaire.tsx',
    styleName: 'progressContainer, progressDot, progressDotActive',
    controls: 'Dot colors, spacing, active state',
  },

  // Navigation buttons
  buttons: {
    file: 'OnboardingQuestionnaire.tsx',
    styleName: 'navButton, backButton, nextButton',
    controls: 'Button colors, size, text styling',
  },
};

// STEP 3: EXPLORE INDIVIDUAL INPUT COMPONENTS
// ===========================================

export const inputComponentGuide = {
  radioButtons: {
    location: 'src/components/RadioGroup/RadioGroup.tsx',
    whenToSee: 'Step 1 - Parent Type selection',
    howToTest: "Click between 'Single Parent' and 'Two Parents'",
    stylingTips: [
      'Look for `styles.optionContainer` for the overall button',
      'Look for `styles.radioCircle` for the circular indicator',
      'Look for `styles.selectedOption` for the selected state',
    ],
  },

  numberPicker: {
    location: 'src/components/NumberCarousel/NumberCarousel.tsx',
    whenToSee: 'Step 2 - Child age selection',
    howToTest: 'Scroll through the numbers or click on them',
    stylingTips: [
      'Look for `styles.carouselContainer` for the overall container',
      'Look for `styles.selectionIndicator` for the center highlight',
      'Look for `styles.itemText` for number styling',
    ],
  },

  textInput: {
    location: 'src/components/QuestionnaireTextInput/QuestionnaireTextInput.tsx',
    whenToSee: 'Step 3 - Child name entry',
    howToTest: 'Click in the text field and type',
    stylingTips: [
      'Look for `styles.inputContainer` for the outer border',
      'Look for `styles.textInput` for the actual input field',
      'Look for `styles.focusedContainer` for the focused state',
    ],
  },

  checkboxes: {
    location: 'src/components/CheckboxGroup/CheckboxGroup.tsx',
    whenToSee: 'Step 4 - Challenges selection',
    howToTest: 'Click on multiple challenge options',
    stylingTips: [
      'Look for `styles.checkboxContainer` for each option',
      'Look for `styles.checkboxSquare` for the checkbox itself',
      'Look for `styles.checkboxContainerSelected` for selected state',
    ],
  },
};

// STEP 4: PRACTICAL STYLING WORKFLOW
// ==================================

/*
Here's the recommended workflow for styling:

1. IDENTIFY WHAT YOU WANT TO CHANGE
   - Open the questionnaire in your browser
   - Navigate through all steps (Next button)
   - Note what you want to change

2. FIND THE RIGHT FILE
   - Use the guide above to find which file controls that element
   - Open that file in VS Code

3. LOCATE THE STYLES SECTION
   - Scroll to the bottom of the file
   - Look for `const styles = StyleSheet.create({`
   - Find the style name from the guide

4. MODIFY THE STYLES
   - Change colors using hex codes: backgroundColor: '#FF0000'
   - Change sizes using numbers: fontSize: 18, padding: 20
   - Change spacing: margin: 10, gap: 15

5. SAVE AND TEST
   - Save the file (Ctrl+S)
   - Check your browser - it should update automatically
   - Navigate through the questionnaire to see your changes
*/

// STEP 5: COMMON STYLING PROPERTIES
// =================================

export const commonProperties = {
  colors: {
    backgroundColor: '#FFFFFF', // Background color
    color: '#000000', // Text color
    borderColor: '#CCCCCC', // Border color
  },

  sizing: {
    width: 200, // Fixed width in pixels
    height: 48, // Fixed height in pixels
    fontSize: 16, // Text size
    padding: 20, // Inside spacing
    margin: 10, // Outside spacing
  },

  positioning: {
    alignItems: 'center', // Horizontal alignment
    justifyContent: 'center', // Vertical alignment
    textAlign: 'center', // Text alignment
  },

  borders: {
    borderWidth: 1, // Border thickness
    borderRadius: 8, // Rounded corners
    borderStyle: 'solid', // Border type
  },
};

// STEP 6: DEBUGGING TIPS
// ======================

/*
If something doesn't look right:

1. CHECK THE BROWSER CONSOLE
   - Press F12 in your browser
   - Look for any red error messages

2. VERIFY THE FILE SAVED
   - Make sure you saved the file (Ctrl+S)
   - Check if the browser shows HMR update message

3. CHECK SPELLING
   - Style property names are case-sensitive
   - Use camelCase: backgroundColor (not background-color)

4. USE TEMPORARY BORDERS
   - Add borderWidth: 3, borderColor: 'red' to see element boundaries
   - Remove when you're done debugging

5. BACKUP YOUR CHANGES
   - Save your original styles before making big changes
   - Use Git to track your progress
*/
