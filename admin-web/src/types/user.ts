export interface SwipeStats {
  totalSwipes: number;
  todaySwipes: number;
  rightSwipes: number;
  leftSwipes: number;
  lastSwipeDate: Date | null;
}

export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  interestedIn?: string[];
  lookingFor?: string[];
  pictures?: string[];
  interests?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onboarding?: {
    completed: boolean;
    currentStep: number;
    data?: any;
    lastUpdated?: any;
  };
  createdAt?: any;
  updatedAt?: any;
  lastActive?: any;
  userAskedToDelete?: string;
  deleteRequestedAt?: any;
  fcmToken?: string;
  deviceTokens?: string[];
  rating?: number; // Admin rating for profile (1-5)
  swipeStats?: SwipeStats; // Swipe statistics for the user
}

export interface UserFilters {
  search?: string;
  registeredToday?: boolean;
  registeredYesterday?: boolean;
  registeredThisWeek?: boolean;
  registeredThisMonth?: boolean;
  gender?: string;
  lookingFor?: string[];
  hasDeleteRequest?: boolean;
}
