import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FabIcon, Fab, FabLabel } from "@/components/ui/fab";
import { LogoIcon } from "@/components/shared/icons";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon, Icon } from "@/components/ui/icon";
import { getNextOnboardingStep, isOnboardingComplete } from "@/services/onboarding";
import { getUserProfile } from "@/services/profile";

const AnimatedHstack = Animated.createAnimatedComponent(HStack);
const AnimatedText = Animated.createAnimatedComponent(Text);

const verified = () => {
  const insets = useSafeAreaInsets();
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const checkProgress = async () => {
      console.log("Verified screen: Checking user progress");

      // Check if user has completed profile data
      const userProfile = await getUserProfile();
      console.log("Verified screen - User profile:", userProfile);

      // Check if user has essential profile data
      const hasProfileData = userProfile &&
                            userProfile.firstName &&
                            userProfile.dob;

      // Also check the onboarding completion flag
      const complete = await isOnboardingComplete();
      console.log("Verified screen - Onboarding completed flag:", complete);
      console.log("Verified screen - Has profile data:", hasProfileData);

      // If user has profile data OR onboarding is marked complete, go to home
      if (complete || hasProfileData) {
        console.log("Verified screen: User has complete profile, redirecting to home");
        setIsComplete(true);
        setTimeout(() => {
          router.replace("/(protected)/(root)/home");
        }, 1500);
        return;
      }

      const step = await getNextOnboardingStep();
      console.log("Verified screen - Next step:", step);
      setNextStep(step);
    };

    checkProgress();
  }, []);

  const handleContinue = () => {
    if (isComplete) {
      router.replace("/(protected)/(root)/home");
    } else if (nextStep) {
      router.push(`/onboarding/${nextStep}`);
    } else {
      router.push("/onboarding/name");
    }
  };

  return (
    <Box className="px-5 gap-4 flex-1 items-center justify-center">
      <AnimatedHstack
        entering={FadeInDown.duration(400)}
        className="gap-4 w-full justify-center items-center"
      >
        <Icon as={LogoIcon} className="w-[72px] h-[72px]" />
        <Text className="font-semibold font-roboto text-4xl leading-10 text-typography-950 flex-1">
          Yayy! Your code is verified!
        </Text>
      </AnimatedHstack>
      <AnimatedText
        entering={FadeInDown.delay(400).duration(400)}
        className="font-roboto text-typography-500 text-base leading-6"
      >
        {isComplete
          ? "Welcome back! Taking you to your profile..."
          : nextStep
            ? "Welcome back! Let's continue setting up your profile."
            : "Your phone number has been successfully verified. Now, let's set up your profile details to get started."}
      </AnimatedText>
      {!isComplete && (
        <Fab
          className="bg-background-950 rounded-lg w-auto h-[48px] absolute bottom-11 right-5 data-[active=true]:bg-background-900"
          onPress={handleContinue}
          style={{ marginBottom: -1 * insets.bottom }}
        >
          <FabLabel className="text-typography-50 font-roboto font-medium">
            {nextStep ? "Continue" : "Enter Details"}
          </FabLabel>
          <FabIcon as={ChevronRightIcon} />
        </Fab>
      )}
    </Box>
  );
};
export default verified;
