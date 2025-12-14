import React from "react";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon, FabLabel } from "@/components/ui/fab";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

const AnimatedVstack = Animated.createAnimatedComponent(VStack);

const done = () => {
  const insets = useSafeAreaInsets();
  return (
    <Box className="flex-1 justify-center items-center gap-11 px-5 w-[100%] pb-28">
      <AnimatedVstack
        entering={FadeInDown.duration(400)}
        className="gap-7 justify-center items-center"
      >
        <Image
          source={require("@/assets/images/onboarding/onboarding-completed.png")}
          alt="Logo"
          className="w-[350px] h-[338px]"
        />
        <AnimatedVstack
          entering={FadeInDown.delay(400).duration(400)}
          className="gap-2"
        >
          <Heading className="text-typography-950 text-4xl font-roboto font-semibold">
            Yayy All done!
          </Heading>
          <Text className="text-typography-500 text-xl font-roboto font-medium">
            Lets see who catches your eye.
          </Text>
        </AnimatedVstack>
      </AnimatedVstack>
      <Fab
        onPress={() => {
          router.push("/home");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabLabel>Start Swiping</FabLabel>
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};

export default done;
