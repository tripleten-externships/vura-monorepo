/**
 * PRACTICAL EXAMPLE: How to Change the Main Background Color
 *
 * Follow these exact steps to see how styling works
 */

// CURRENT CHALLENGE: Let's change the questionnaire background from white to light blue

/*
STEP 1: Open the questionnaire
- Go to: http://localhost:3001/questionnaire-demo
- You should see a white background

STEP 2: Find the right file
- Open: src/components/OnboardingQuestionnaire/OnboardingQuestionnaire.tsx

STEP 3: Find the styles section
- Scroll to the very bottom of the file (around line 350+)
- Look for: const styles = StyleSheet.create({

STEP 4: Find the container style
- Look for: container: {
- You'll see something like: backgroundColor: '#FFFFFF',

STEP 5: Change the color
- Change '#FFFFFF' to '#F0F8FF' (light blue)
- Save the file (Ctrl+S)

STEP 6: Check the result
- Look at your browser - the background should now be light blue!
*/

// EXAMPLE 2: Change Button Colors

/*
STEP 1: Navigate to step 1 of the questionnaire (Parent Type)
- You should see "Previous" and "Next" buttons at the bottom

STEP 2: Find the button styles (same file, bottom section)
- Look for: nextButton: {
- You'll see: backgroundColor: '#363636', (dark gray)

STEP 3: Change to blue
- Change '#363636' to '#007AFF' (blue)
- Save and check the browser

STEP 4: Change the back button too
- Look for: backButton: {  
- Change borderColor: '#363636' to borderColor: '#007AFF'
*/

// EXAMPLE 3: Make Text Bigger

/*
STEP 1: Look at the questionnaire title
- "Questionnaire Demo" at the top

STEP 2: Find the title style  
- In the same OnboardingQuestionnaire.tsx file
- Look for: headerTitle: { 
- You'll see: fontSize: 28,

STEP 3: Make it bigger
- Change 28 to 36
- Save and see the larger text
*/

// WHAT EACH COLOR CODE MEANS
export const colorExamples = {
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
  darkGray: '#363636',
  blue: '#007AFF',
  lightBlue: '#F0F8FF',
  green: '#34C759',
  red: '#FF3B30',
  purple: '#AF52DE',
  orange: '#FF9500',
};

// WHAT EACH SIZE NUMBER MEANS
export const sizeExamples = {
  fontSize: {
    small: 12,
    normal: 16,
    large: 20,
    title: 28,
    huge: 36,
  },
  spacing: {
    tight: 8,
    normal: 16,
    loose: 24,
    veryLoose: 32,
  },
  buttonHeight: {
    small: 36,
    normal: 48,
    large: 56,
  },
};

/*
TROUBLESHOOTING:

Problem: "I changed the color but nothing happened"
Solution: 
- Make sure you saved the file (Ctrl+S)
- Check the browser console for errors (F12)
- Make sure you're looking at the right element

Problem: "The app crashed/shows error"
Solution:
- Check spelling of property names (backgroundColor not background-color)
- Make sure you have quotes around color codes: '#FF0000'
- Check that you have commas after each property

Problem: "I can't find the right style"
Solution:
- Look for the component name in the JSX (the return section)
- Match style={styles.XXXXX} with the style name at the bottom
- Use the debug borders to identify sections

NEXT STEPS:
1. Try changing the background color
2. Try changing a button color  
3. Try making text bigger
4. Once comfortable, move to individual components (RadioGroup, etc.)
*/
