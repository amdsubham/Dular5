import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { analytics } from './analytics';

export type OnboardingStep =
  | 'name'
  | 'dob'
  | 'gender'
  | 'interest'
  | 'looking-for'
  | 'pictures'
  | 'interests'
  | 'location'
  | 'done';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  data: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    interestedIn?: string[];
    lookingFor?: string[];
    pictures?: string[];
    interests?: string[];
    latitude?: number | null;
    longitude?: number | null;
  };
  completed: boolean;
  lastUpdated: Date;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'name',
  'dob',
  'gender',
  'interest',
  'looking-for',
  'pictures',
  'interests',
  'location',
];

/**
 * Get user's onboarding progress
 */
export const getOnboardingProgress = async (userId: string): Promise<OnboardingProgress | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        currentStep: data.onboarding?.currentStep || 'name',
        completedSteps: data.onboarding?.completedSteps || [],
        data: data.onboarding?.data || {},
        completed: data.onboarding?.completed || false,
        lastUpdated: data.onboarding?.lastUpdated?.toDate() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return null;
  }
};

/**
 * Update onboarding progress
 */
export const updateOnboardingProgress = async (
  step: OnboardingStep,
  stepData?: Partial<OnboardingProgress['data']>
): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;
    const userRef = doc(db, 'users', userId);
    const currentDoc = await getDoc(userRef);

    const currentProgress: OnboardingProgress = currentDoc.exists()
      ? {
          currentStep: currentDoc.data().onboarding?.currentStep || 'name',
          completedSteps: currentDoc.data().onboarding?.completedSteps || [],
          data: currentDoc.data().onboarding?.data || {},
          completed: currentDoc.data().onboarding?.completed || false,
          lastUpdated: currentDoc.data().onboarding?.lastUpdated?.toDate() || new Date(),
        }
      : {
          currentStep: 'name',
          completedSteps: [],
          data: {},
          completed: false,
          lastUpdated: new Date(),
        };

    // Update completed steps
    const completedSteps = [...new Set([...currentProgress.completedSteps, step])];

    // Determine next step
    const currentIndex = ONBOARDING_STEPS.indexOf(step);
    const nextStep: OnboardingStep = currentIndex < ONBOARDING_STEPS.length - 1
      ? ONBOARDING_STEPS[currentIndex + 1]
      : 'done';

    // Check if onboarding is complete
    const completed = completedSteps.length === ONBOARDING_STEPS.length;

    const updatedProgress: OnboardingProgress = {
      currentStep: completed ? 'done' : nextStep,
      completedSteps,
      data: {
        ...currentProgress.data,
        ...stepData,
      },
      completed,
      lastUpdated: new Date(),
    };

    // Prepare location data to be stored at root level for easier querying
    const updateData: any = {
      onboarding: {
        ...updatedProgress,
        lastUpdated: new Date(),
      },
    };

    // If location data is provided, also store it at root level
    if (stepData && ('latitude' in stepData || 'longitude' in stepData)) {
      updateData.location = {
        latitude: stepData.latitude,
        longitude: stepData.longitude,
        lastUpdated: new Date(),
      };
    }

    if (currentDoc.exists()) {
      await updateDoc(userRef, updateData);
    } else {
      await setDoc(userRef, {
        ...updateData,
        phoneNumber: user.phoneNumber || '',
        createdAt: new Date(),
      });
    }

    // Track onboarding step completion
    await analytics.trackOnboardingStep(step, true, stepData);

    // Track specific onboarding events
    if (step === 'name' && stepData) {
      await analytics.updateUserProperties({
        firstName: stepData.firstName,
        lastName: stepData.lastName,
      });
    } else if (step === 'dob' && stepData) {
      await analytics.updateUserProperties({
        dateOfBirth: stepData.dob,
      });
    } else if (step === 'gender' && stepData) {
      await analytics.updateUserProperties({
        gender: stepData.gender,
      });
    } else if (step === 'interest' && stepData) {
      await analytics.updateUserProperties({
        interestedIn: stepData.interestedIn,
      });
    } else if (step === 'looking-for' && stepData) {
      await analytics.updateUserProperties({
        lookingFor: stepData.lookingFor,
      });
    } else if (step === 'pictures' && stepData) {
      await analytics.track('profile_pictures_uploaded', {
        count: stepData.pictures?.length || 0,
      });
    } else if (step === 'interests' && stepData) {
      await analytics.updateUserProperties({
        interests: stepData.interests,
      });
    } else if (step === 'location' && stepData) {
      await analytics.updateUserProperties({
        hasLocation: stepData.latitude !== null && stepData.longitude !== null,
      });
    }

    // Track onboarding completion
    if (completed) {
      await analytics.track('onboarding_completed', {
        totalSteps: ONBOARDING_STEPS.length,
        completionTime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error updating onboarding progress:', error);

    // Track onboarding error
    await analytics.trackError(error as Error, {
      action: 'onboarding_update',
      step,
    });

    throw error;
  }
};

/**
 * Get the next step user should go to
 */
export const getNextOnboardingStep = async (): Promise<OnboardingStep | null> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return 'name';
    }

    const progress = await getOnboardingProgress(user.uid);
    if (!progress) {
      return 'name';
    }

    if (progress.completed) {
      return null; // Onboarding complete
    }

    return progress.currentStep;
  } catch (error) {
    console.error('Error getting next onboarding step:', error);
    return 'name';
  }
};

/**
 * Check if user has completed onboarding
 */
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }

    const progress = await getOnboardingProgress(user.uid);
    return progress?.completed || false;
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return false;
  }
};

