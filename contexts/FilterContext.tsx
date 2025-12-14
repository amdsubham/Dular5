import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getUserPreferences } from '@/services/matching';

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
  interestedIn: [],
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
            interestedIn: userPrefs.interestedIn || [],
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

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
