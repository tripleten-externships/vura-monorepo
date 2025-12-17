import { makeObservable, observable, action, computed } from 'mobx';
import { BaseStore } from './baseStore';
import type { RootStore } from './rootStore';

export interface OnboardingResponses {
  // Step 1: Parent count
  parentType: 'one-parent' | 'two-parents' | null;

  // Step 2: Parent age
  parentAge: number | null;

  // Step 3: Health conditions (text input)
  healthConditionsText: string;

  // Step 4: Health conditions (checkboxes)
  healthConditions: string[];

  // Step 4: Selected challenge (single selection)
  selectedChallenge: string | null;

  // Step 4: Other challenge text (when "other" is selected)
  otherChallengeText: string;

  // Step 5: Challenges faced (legacy - keeping for now)
  challenges: string[];

  // Step 5: User age
  userAge: number | null;
}

/**
 * Store for managing onboarding questionnaire responses
 * Handles local state persistence during the questionnaire flow
 */
export class OnboardingStore extends BaseStore {
  // Questionnaire responses
  public responses: OnboardingResponses = {
    parentType: null,
    parentAge: null,
    healthConditionsText: '',
    healthConditions: [],
    selectedChallenge: null,
    otherChallengeText: '',
    challenges: [],
    userAge: null,
  };

  // Current step tracking
  public currentStep: number = 1;
  public totalSteps: number = 5; // Temporarily reduced from 6 (removed step 4)

  // UI state
  public isLoading: boolean = false;
  public errors: Record<string, string> = {};

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      // Observables
      responses: observable,
      currentStep: observable,
      totalSteps: observable,
      isLoading: observable,
      errors: observable,

      // Actions
      setParentType: action,
      setParentAge: action,
      setUserAge: action,
      setHealthConditionsText: action,
      setHealthConditions: action,
      toggleHealthCondition: action,
      toggleChallenge: action,
      setSelectedChallenge: action,
      setOtherChallengeText: action,
      nextStep: action,
      previousStep: action,
      goToStep: action,
      validateCurrentStep: action,
      setError: action,
      clearError: action,
      clearAllErrors: action,
      reset: action,

      // Computed
      isComplete: computed,
      completionPercentage: computed,
    });
  }

  /**
   * Update parent type selection
   */
  setParentType(parentType: 'one-parent' | 'two-parents') {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.parentType = parentType;
    this.clearError('parentType');
  }

  /**
   * Update parent's age
   */
  setParentAge = (age: number) => {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.parentAge = age;
    this.clearError('parentAge');
  };

  /**
   * Update user's age
   */
  setUserAge = (age: number) => {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.userAge = age;
    this.clearError('userAge');
  };

  /**
   * Update health conditions text (Step 3)
   */
  setHealthConditionsText(conditions: string) {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.healthConditionsText = conditions;
    this.clearError('healthConditionsText');
  }

  /**
   * Update health conditions checkboxes (Step 4)
   */
  setHealthConditions(conditions: string[]) {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.healthConditions = conditions;
    this.clearError('healthConditions');
  }

  /**
   * Toggle a health condition
   */
  toggleHealthCondition(condition: string) {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    if (this.responses.healthConditions.includes(condition)) {
      this.responses.healthConditions = this.responses.healthConditions.filter(
        (c) => c !== condition
      );
    } else {
      this.responses.healthConditions.push(condition);
    }
    this.clearError('healthConditions');
  }

  /**
   * Toggle a challenge
   */
  toggleChallenge(challenge: string) {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    if (this.responses.challenges.includes(challenge)) {
      this.responses.challenges = this.responses.challenges.filter((c) => c !== challenge);
    } else {
      this.responses.challenges.push(challenge);
    }
    this.clearError('challenges');
  }

  /**
   * Set selected challenge (single selection)
   */
  setSelectedChallenge = (challenge: string | null) => {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.selectedChallenge = challenge;
    // Clear other challenge text if not selecting "other"
    if (challenge !== 'other') {
      this.responses.otherChallengeText = '';
    }
    this.clearError('selectedChallenge');
  };

  /**
   * Set other challenge text
   */
  setOtherChallengeText(text: string) {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return;
    }
    this.responses.otherChallengeText = text;
    // Automatically select "other" when text is entered
    if (text.trim() && this.responses.selectedChallenge !== 'other') {
      this.responses.selectedChallenge = 'other';
    }
    this.clearError('selectedChallenge');
  }

  /**
   * Navigate to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Go to a specific step
   */
  goToStep(step: number) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  /**
   * Validate current step
   */
  validateCurrentStep(): boolean {
    if (!this.responses) {
      console.warn('OnboardingStore responses not initialized');
      return false;
    }
    this.clearAllErrors();

    switch (this.currentStep) {
      case 1: // Parent type
        if (!this.responses.parentType) {
          this.setError('parentType', 'Please select an option');
          return false;
        }
        break;

      case 2: // Parent age
        if (
          !this.responses.parentAge ||
          this.responses.parentAge < 18 ||
          this.responses.parentAge > 100
        ) {
          this.setError('parentAge', 'Please select a valid age');
          return false;
        }
        break;

      case 3: // Health conditions (text)
        if (!this.responses.healthConditionsText.trim()) {
          this.setError('healthConditionsText', 'Please enter health conditions or "None"');
          return false;
        }
        break;

      case 4: // Challenges (single selection)
        if (!this.responses.selectedChallenge) {
          this.setError('selectedChallenge', 'Please select a challenge');
          return false;
        }
        // If "other" is selected, validate that text is provided
        if (
          this.responses.selectedChallenge === 'other' &&
          !this.responses.otherChallengeText.trim()
        ) {
          this.setError('selectedChallenge', 'Please provide details for "Other"');
          return false;
        }
        break;

      case 5: // User age
        if (!this.responses.userAge || this.responses.userAge < 18 || this.responses.userAge > 80) {
          this.setError('userAge', 'Please select a valid age');
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * Set an error for a field
   */
  setError(field: string, message: string) {
    this.errors[field] = message;
  }

  /**
   * Clear error for a field
   */
  clearError(field: string) {
    delete this.errors[field];
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    this.errors = {};
  }

  /**
   * Check if form is complete
   */
  get isComplete(): boolean {
    return (
      this.responses.parentType !== null &&
      this.responses.parentAge !== null &&
      this.responses.healthConditionsText.trim() !== '' &&
      this.responses.healthConditions.length > 0 &&
      this.responses.challenges.length > 0 &&
      this.responses.userAge !== null
    );
  }

  /**
   * Get completion percentage
   */
  get completionPercentage(): number {
    let completed = 0;
    if (this.responses.parentType) completed++;
    if (this.responses.parentAge) completed++;
    if (this.responses.healthConditionsText.trim()) completed++;
    if (this.responses.healthConditions.length > 0) completed++;
    if (this.responses.challenges.length > 0) completed++;
    if (this.responses.userAge) completed++;

    return Math.round((completed / 6) * 100);
  }

  /**
   * Reset the store to initial state
   */
  reset() {
    this.responses = {
      parentType: null,
      parentAge: null,
      healthConditionsText: '',
      healthConditions: [],
      selectedChallenge: null,
      otherChallengeText: '',
      challenges: [],
      userAge: null,
    };
    this.currentStep = 1;
    this.isLoading = false;
    this.errors = {};
  }

  /**
   * Get summary of responses for debugging/logging
   */
  getSummary() {
    return {
      ...this.responses,
      currentStep: this.currentStep,
      isComplete: this.isComplete,
      completionPercentage: this.completionPercentage,
    };
  }
}
