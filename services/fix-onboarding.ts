import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';

/**
 * Fix onboarding.completed flag for current user
 * Call this once if your user has all steps completed but completed=false
 */
export const fixCurrentUserOnboarding = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('No user authenticated');
      return false;
    }

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('User document not found');
      return false;
    }

    const data = userDoc.data();
    const onboarding = data.onboarding;

    if (!onboarding) {
      console.error('No onboarding data');
      return false;
    }

    const completedSteps = onboarding.completedSteps || [];
    const requiredSteps = ['name', 'dob', 'gender', 'interest', 'looking-for', 'pictures', 'interests', 'location'];
    const hasAllSteps = requiredSteps.every(step => completedSteps.includes(step));

    if (hasAllSteps && !onboarding.completed) {
      console.log('🔧 Fixing onboarding.completed flag...');
      await updateDoc(userRef, {
        'onboarding.completed': true,
        'onboarding.currentStep': 'done'
      });
      console.log('✅ Fixed! onboarding.completed is now true');
      return true;
    } else if (onboarding.completed) {
      console.log('✓ Onboarding already marked as completed');
      return false;
    } else {
      console.log('⏭ Onboarding is genuinely incomplete');
      console.log(`Completed steps: ${completedSteps.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.error('Error fixing onboarding:', error);
    return false;
  }
};
