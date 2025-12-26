import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getUserPreferences } from '@/services/matching';
import { updateUserProfile } from '@/services/profile';
import { analytics } from '@/services/analytics';

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
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [initialized, setInitialized] = useState(false);

  // Load user's onboarding preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const userPrefs = await getUserPreferences();
        if (userPrefs && !initialized) {
          setFilters((prev) => ({
            ...prev,
            // If user preferences exist, use them; otherwise use defaults
            interestedIn: (userPrefs.interestedIn && userPrefs.interestedIn.length > 0)
              ? userPrefs.interestedIn
              : defaultFilters.interestedIn,
            lookingFor: userPrefs.lookingFor || [],
          }));
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error loading user preferences for filters:', error);
        setInitialized(true);
      }
    };

    loadUserPreferences();
  }, [initialized]);

  const updateFilters = async (newFilters: Partial<FilterState>) => {
    // Update local state first
    setFilters((prev) => ({ ...prev, ...newFilters }));

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
