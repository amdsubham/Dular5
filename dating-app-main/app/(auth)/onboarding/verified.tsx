import React from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FabIcon, Fab, FabLabel } from "@/components/ui/fab";
import { LogoIcon } from "@/components/shared/icons";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon, Icon } from "@/components/ui/icon";
const AnimatedHstack = Animated.createAnimatedComponent(HStack);
const AnimatedText = Animated.createAnimatedComponent(Text);
const verified = () => {
  const insets = useSafeAreaInsets();
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
        Your phone number has been successfully verified. Now, let's set up your
        profile details to get started.
      </AnimatedText>
      <Fab
        className="bg-background-950 rounded-lg w-auto h-[48px] absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        onPress={() => router.push("/onboarding/name")}
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabLabel className="text-typography-50 font-roboto font-medium">
          Enter Details
        </FabLabel>
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};

export default verified;
