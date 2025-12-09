import { useEffect } from 'react';
import { setupPresenceTracking } from '@/services/presence';

/**
 * Hook to setup presence tracking for the current user
 * Should be called once at app root level
 */
export const usePresenceTracking = () => {
  useEffect(() => {
    const cleanup = setupPresenceTracking();
    return cleanup;
  }, []);
};
