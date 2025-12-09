import { useEffect } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase";
import { isOnboardingComplete, getNextOnboardingStep } from "@/services/onboarding";
import { getUserProfile } from "@/services/profile";
import { ActivityIndicator } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in
        console.log("User logged in:", user.uid);

        // Check if user has completed profile data
        const userProfile = await getUserProfile();
        console.log("User profile:", userProfile);

        // Check if user has essential profile data (firstName and at least one picture)
        const hasProfileData = userProfile &&
                              userProfile.firstName &&
                              userProfile.dob;

        // Also check the onboarding completion flag
        const completed = await isOnboardingComplete();
        console.log("Onboarding completed flag:", completed);
        console.log("Has profile data:", hasProfileData);

        // If user has profile data OR onboarding is marked complete, go to home
        if (completed || hasProfileData) {
          console.log("Redirecting to home");
          router.replace("/(protected)/(root)/home");
        } else {
          // Onboarding incomplete, resume from where they left off
          console.log("Onboarding incomplete, checking next step");
          const nextStep = await getNextOnboardingStep();
          console.log("Next step:", nextStep);

          if (nextStep === null || nextStep === 'name') {
            // Start from the beginning (after verification)
            router.replace("/(auth)/onboarding/verified");
          } else {
            // Resume from the last incomplete step
            const stepRoutes: Record<string, string> = {
              'dob': '/(auth)/onboarding/dob',
              'gender': '/(auth)/onboarding/gender',
              'interest': '/(auth)/onboarding/interest',
              'looking-for': '/(auth)/onboarding/looking-for',
              'pictures': '/(auth)/onboarding/pictures',
              'interests': '/(auth)/onboarding/interests',
              'done': '/(auth)/onboarding/done',
            };
            const route = stepRoutes[nextStep] || "/(auth)/onboarding/verified";
            router.replace(route as any);
          }
        }
      } else {
        // User is not logged in, go to login
        console.log("User not logged in, redirecting to auth");
        router.replace("/(auth)");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box className="flex-1 items-center justify-center bg-background-0">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-typography-500">Loading...</Text>
    </Box>
  );
}

