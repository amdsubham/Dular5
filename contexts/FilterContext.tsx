import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getUserPreferences } from '@/services/matching';
import { updateUserProfile } from '@/services/profile';
import { analytics } from '@/services/analytics';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface FilterState {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  lookingFor: string[];
  interestedIn: string[];
}

interface FilterContextType {
  filters: FilterState;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  minAge: 18,
  maxAge: 99,
  maxDistance: 500, // km - maximum distance by default
  lookingFor: [],
  interestedIn: ['Man', 'Woman', 'Nonbinary'], // Default: show all genders
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load user's onboarding preferences when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid !== currentUserId) {
        // User logged in or changed - load their preferences
        console.log('🔍 FilterContext: Auth state changed, user logged in:', user.uid);
        setCurrentUserId(user.uid);
        await loadUserPreferences();
      } else if (!user && currentUserId) {
        // User logged out - reset to defaults
        console.log('🔍 FilterContext: User logged out, resetting to defaults');
        setCurrentUserId(null);
        setFilters(defaultFilters);
        setInitialized(true);
      } else if (!user) {
        // No user on initial load - use defaults temporarily
        console.log('🔍 FilterContext: No user on initial load, using defaults');
        setFilters(defaultFilters);
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const loadUserPreferences = async () => {
    try {
      console.log('🔍 FilterContext: Loading user preferences...');
      const userPrefs = await getUserPreferences();
      console.log('📋 FilterContext: User preferences loaded:', userPrefs);

      if (userPrefs) {
        // Debug logging
        console.log('🔍 FilterContext Debug:');
        console.log('  • userPrefs.interestedIn type:', typeof userPrefs.interestedIn);
        console.log('  • userPrefs.interestedIn value:', userPrefs.interestedIn);
        console.log('  • userPrefs.interestedIn is array?:', Array.isArray(userPrefs.interestedIn));
        console.log('  • userPrefs.interestedIn length:', userPrefs.interestedIn?.length);
        console.log('  • Condition result:', (userPrefs.interestedIn !== null && userPrefs.interestedIn !== undefined && userPrefs.interestedIn.length > 0));

        const newFilters = {
          ...defaultFilters,
          // IMPORTANT: Use user's interestedIn from onboarding if it exists
          // This ensures filter shows only what user selected during onboarding
          interestedIn: (userPrefs.interestedIn && userPrefs.interestedIn.length > 0)
            ? userPrefs.interestedIn
            : defaultFilters.interestedIn,
          lookingFor: (userPrefs.lookingFor && userPrefs.lookingFor.length > 0)
            ? userPrefs.lookingFor
            : [],
        };

        console.log('✅ FilterContext: Setting filters to:', newFilters);
        console.log('  • Final interestedIn:', newFilters.interestedIn);
        setFilters(newFilters);
      } else {
        console.log('⚠️  FilterContext: No user preferences found, using defaults');
        setFilters(defaultFilters);
      }
      setInitialized(true);
    } catch (error) {
      console.error('❌ FilterContext: Error loading user preferences:', error);
      setFilters(defaultFilters);
      setInitialized(true);
    }
  };

  const updateFilters = async (newFilters: Partial<FilterState>) => {
    if (!filters) return;

    // Update local state first
    setFilters((prev) => ({ ...prev!, ...newFilters }));

    // Save interestedIn and lookingFor to database if they changed
    try {
      const profileUpdates: Partial<{ interestedIn: string[]; lookingFor: string[] }> = {};

      if (newFilters.interestedIn !== undefined) {
        profileUpdates.interestedIn = newFilters.interestedIn;
        console.log('💾 Saving interestedIn to database:', newFilters.interestedIn);
      }

      if (newFilters.lookingFor !== undefined) {
        profileUpdates.lookingFor = newFilters.lookingFor;
        console.log('💾 Saving lookingFor to database:', newFilters.lookingFor);
      }

      // Only update database if there are profile changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(profileUpdates);
        console.log('✅ Filter preferences saved to database successfully');
      }

      // Track filter usage in analytics
      await analytics.trackFilterUsage(newFilters).catch(err =>
        console.warn('Analytics tracking failed:', err)
      );
    } catch (error) {
      console.error('❌ Error saving filter preferences to database:', error);
      // Don't throw error - filter still works locally even if save fails
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Don't render children until filters are loaded to prevent showing default values
  if (!filters || !initialized) {
    return null;
  }

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
