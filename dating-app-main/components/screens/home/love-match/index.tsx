import {
  BottomSheet,
  BottomSheetBackdrop,
  BottomSheetDragIndicator,
  BottomSheetContent,
} from "@/components/shared/bottom-sheet";
import { LinearGradient } from "@/components/shared/linear-gradient";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Button, ButtonText } from "@/components/ui/button";
import { PinkHeartIcon, LogoIcon } from "@/components/shared/icons";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import Animated, {
  BounceIn,
  BounceInLeft,
  BounceInRight,
  FadeInDown,
} from "react-native-reanimated";
const AnimatedHStack = Animated.createAnimatedComponent(HStack);
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedBox = Animated.createAnimatedComponent(Box);
const AnimatedText = Animated.createAnimatedComponent(Text);

export const LoveMatchBottomSheet = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  const router = useRouter();
  return (
    <BottomSheet
      isOpen={isOpen}
      index={0}
      enableDynamicSizing
      enableOverDrag={false}
      onClose={() => {
        setIsOpen(false);
      }}
      backdropComponent={BottomSheetBackdrop}
      handleComponent={() => {
        return (
          <BottomSheetDragIndicator
            className="border-0 bg-background-pink rounded-t-xl"
            indicatorStyle={{
              backgroundColor: "gray",
              width: 64,
              height: 4,
              marginTop: 10,
            }}
          />
        );
      }}
    >
      <BottomSheetContent className="border-0 bg-background-0">
        <LinearGradient
          colors={["#BE185D33", "#BE185D00"]}
          className="px-4 pb-8 pt-[52px] flex flex-col gap-12 w-full"
        >
          <Box className="flex flex-col items-center justify-center gap-6">
            <AnimatedHStack
              className="justify-center items-center gap-2"
              entering={FadeInDown.duration(500)
                .delay(600)
                .withInitialValues({
                  transform: [{ translateY: 200 }],
                })
                .springify()}
            >
              <Heading size="3xl">Its a match!</Heading>
              <Icon as={LogoIcon} className="w-9 h-7" />
            </AnimatedHStack>

            <HStack className="justify-center items-center h-[210px] w-[440px]">
              <AnimatedImage
                source={require("@/assets/images/common/match_1.png")}
                className="h-[210px] w-[300px] rounded-lg absolute left-0"
                contentFit="contain"
                alt="match"
                entering={BounceInLeft.delay(200)}
              />
              <AnimatedImage
                source={require("@/assets/images/common/match_2.png")}
                className="h-[210px] w-[300px] rounded-lg absolute right-0"
                contentFit="contain"
                alt="match"
                entering={BounceInRight.delay(200)}
              />
              <AnimatedBox
                className="rounded-2xl bg-typography-950 p-5 bottom-[50] absolute"
                entering={BounceIn.delay(600)}
              >
                <Icon as={PinkHeartIcon} className="h-6 w-6" />
              </AnimatedBox>
            </HStack>
            <AnimatedText entering={FadeInDown.delay(800)}>
              <Text className="font-bold">You</Text> and{" "}
              <Text className="font-bold">Victoria</Text> liked each other
            </AnimatedText>
          </Box>
          <AnimatedBox
            className="w-full flex flex-col gap-4"
            entering={FadeInDown.delay(800)}
          >
            <Button
              size="lg"
              onPress={() => {
                setIsOpen(false);
                router.push("/messages/1");
              }}
            >
              <ButtonText className="text-typography-950 data-[active=true]:text-typography-900">
                Send Message
              </ButtonText>
            </Button>
            <Button
              size="lg"
              className="bg-transparent data-[active=true]:bg-background-50"
            >
              <ButtonText className="text-typography-950 data-[active=true]:text-typography-900">
                View Profile
              </ButtonText>
            </Button>
          </AnimatedBox>
        </LinearGradient>
      </BottomSheetContent>
    </BottomSheet>
  );
};
