import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentUser } from './auth';
import { OnboardingProgress } from './onboarding';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  interestedIn?: string[];
  lookingFor?: string[];
  pictures?: string[];
  deletedPictures?: string[]; // Track deleted photos for admin viewing
  interests?: string[];
  createdAt?: string | Date;
}

/**
 * Get user profile data from Firestore
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('Full user document data:', JSON.stringify(data, null, 2));

      // Try to get profile data from onboarding.data
      let profileData = data.onboarding?.data || {};

      // If no data in onboarding.data, check if data is at root level
      if (!profileData.firstName) {
        profileData = {
          firstName: data.firstName || data.name,
          lastName: data.lastName,
          dob: data.dob || data.dateOfBirth,
          gender: data.gender,
          interestedIn: data.interestedIn || data.interested_in,
          lookingFor: data.lookingFor || data.looking_for,
          pictures: data.pictures || data.photos,
          interests: data.interests || data.hobbies,
          createdAt: data.createdAt,
        };
      } else {
        // If we got data from onboarding.data, still add createdAt from root
        profileData.createdAt = data.createdAt;
      }

      console.log('Extracted profile data:', profileData);
      return profileData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile data
 */
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(db, 'users', user.uid);
    const currentDoc = await getDoc(userRef);

    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const currentProfile = currentData.onboarding?.data || {};

      console.log('📥 updateUserProfile: Current profile from Firestore:', JSON.stringify(currentProfile, null, 2));
      console.log('🔄 updateUserProfile: New data to merge:', JSON.stringify(profileData, null, 2));

      // Merge with existing data
      const updatedProfile = {
        ...currentProfile,
        ...profileData,
      };

      console.log('💾 updateUserProfile: Final merged profile to save:', JSON.stringify(updatedProfile, null, 2));
      console.log('📸 updateUserProfile: Pictures in final profile:', updatedProfile.pictures);

      await updateDoc(userRef, {
        'onboarding.data': updatedProfile,
        'onboarding.lastUpdated': new Date(),
      });

      console.log('✅ updateUserProfile: Profile saved successfully');
    } else {
      throw new Error('User document not found');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Update user account deletion request flag
 */
export const updateUserDeleteRequest = async (requestDelete: boolean): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      userAskedToDelete: requestDelete ? 'yes' : 'no',
      deleteRequestedAt: requestDelete ? new Date() : null,
    });
  } catch (error) {
    console.error('Error updating delete request:', error);
    throw error;
  }
};

