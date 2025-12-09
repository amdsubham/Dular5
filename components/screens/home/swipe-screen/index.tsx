import React, { useCallback, useState } from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ThreeDotsIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { ScrollView } from "@/components/ui/scroll-view";
import { Badge } from "@/components/ui/badge";
import { ImageBackground } from "@/components/ui/image-background";
import { LinearGradient } from "expo-linear-gradient";
import { LocationBadge, LoveBadge } from "@/components/shared/badge";
import { Text } from "@/components/ui/text";
import { InstaCard } from "@/components/shared/instagram-card";
import { HeartIcon } from "@/components/shared/icons";
import { CloseIcon } from "@/components/ui/icon";
import { LoveMatchBottomSheet } from "@/components/screens/home/love-match";
import { users } from "@/data/data";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const AnimatedBox = Animated.createAnimatedComponent(Box);

type SwipeCardProps = {
  user: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  setSwipeFunctions?: (left: () => void, right: () => void) => void;
};

const SwipeCard = ({
  user,
  onSwipeLeft,
  onSwipeRight,
  setSwipeFunctions,
}: SwipeCardProps) => {
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  const triggerSwipe = (direction: "left" | "right") => {
    const isLeft = direction === "left";
    translateX.value = withTiming(
      (isLeft ? -1 : 1) * SCREEN_WIDTH * 1.5,
      { duration: 500 },
      () => {
        if (isLeft && onSwipeLeft) {
          runOnJS(onSwipeLeft)();
        } else if (!isLeft && onSwipeRight) {
          runOnJS(onSwipeRight)();
        }
      }
    );
    rotation.value = withTiming(isLeft ? -10 : 10, { duration: 500 });
  };

  const triggerSwipeLeft = () => triggerSwipe("left");
  const triggerSwipeRight = () => triggerSwipe("right");

  React.useEffect(() => {
    if (setSwipeFunctions) {
      setSwipeFunctions(triggerSwipeLeft, triggerSwipeRight);
    }
  }, [setSwipeFunctions]);

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-10, 0, 10]
      );
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withSpring(
          Math.sign(event.translationX) * SCREEN_WIDTH * 1.5
        );
        if (event.translationX > 0 && onSwipeRight) {
          runOnJS(onSwipeRight)();
        } else if (event.translationX < 0 && onSwipeLeft) {
          runOnJS(onSwipeLeft)();
        }
      } else {
        translateX.value = withSpring(0);
        rotation.value = withTiming(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const userData = users[user];

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedBox
        entering={FadeIn}
        className="absolute left-0 right-0 top-0 bottom-0 bg-background-0 rounded-3xl"
        style={[rStyle]}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Box className="flex-1 gap-5 w-full p-4 pt-0 pb-20">
            <HStack className="w-full items-center justify-between gap-3">
              <Heading size="3xl" className="font-roboto">
                {userData.name}, {userData.age}
              </Heading>
              {userData.isActive && (
                <Badge
                  variant="outline"
                  className="bg-transparent gap-1 rounded-full border-secondary-700 ml-auto"
                >
                  <Box className="w-2 h-2 bg-secondary-700 rounded-full" />
                  <Text className="text-secondary-700 pb-[3px]">
                    active now
                  </Text>
                </Badge>
              )}
              <Button variant="link" className="bg-transparent">
                <ButtonIcon
                  as={ThreeDotsIcon}
                  className="text-typography-950 data-[active=true]:text-typography-900"
                />
              </Button>
            </HStack>
            <ImageBackground
              source={userData.images[0]}
              className="w-full rounded-lg aspect-[0.8] justify-end overflow-hidden"
            >
              <LinearGradient
                colors={["#12121200", "#121212bb"]}
                className="flex-row w-full justify-between p-4"
              >
                <LoveBadge lovePercentage={userData.lovePercentage} size="lg" />
                <LocationBadge distance={userData.distance} size="lg" />
              </LinearGradient>
            </ImageBackground>
            <Box>
              <ScrollView
                horizontal
                className="w-full"
                showsHorizontalScrollIndicator={false}
              >
                <HStack className="gap-x-3">
                  {userData.interests.map((item, index) => (
                    <Text
                      key={index}
                      size="sm"
                      className="font-roboto bg-background-200 py-2 px-4 rounded-3xl items-center justify-center h-9"
                    >
                      {item}
                    </Text>
                  ))}
                </HStack>
              </ScrollView>
            </Box>
            <ImageBackground
              source={userData.images[1]}
              className="w-full rounded-lg aspect-square overflow-hidden"
            />
            <ImageBackground
              source={userData.images[2]}
              className="w-full rounded-lg aspect-square overflow-hidden"
            />
            <ImageBackground
              source={userData.images[3]}
              className="w-full rounded-lg aspect-square overflow-hidden"
            />
            <ImageBackground
              source={userData.images[4]}
              className="w-full rounded-lg aspect-square overflow-hidden"
            />
            <InstaCard img={userData.images} />
          </Box>
        </ScrollView>
      </AnimatedBox>
    </GestureDetector>
  );
};

function ChooseButtonLayout({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const BUTTON_STYLES = {
    base: "h-[56px] w-[99px] rounded-lg",
    left: "bg-typography-950 data-[active=true]:bg-typography-800",
    right: "",
  };
  return (
    <LinearGradient
      colors={["#12121200", "#121212"]}
      className="absolute flex flex-row justify-center items-start w-screen bottom-[0] left-0 right-0 h-28 pt-10 z-10 gap-4"
    >
      <Button
        className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.left}`}
        size="xl"
        onPress={() => {
          if (onSwipeLeft) onSwipeLeft();
        }}
      >
        <ButtonIcon as={CloseIcon} className="w-6 h-6" />
      </Button>
      <Button
        className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.right}`}
        size="xl"
        onPress={() => {
          if (onSwipeRight) onSwipeRight();
          setIsOpen(true);
        }}
      >
        <ButtonIcon
          as={HeartIcon}
          className="w-6 h-6 text-white fill-white stroke-white"
        />
      </Button>
      <LoveMatchBottomSheet isOpen={isOpen} setIsOpen={setIsOpen} />
    </LinearGradient>
  );
}

const SwipeScreen = ({
  user,
  setSwipeFunctions,
}: {
  user: number;
  setSwipeFunctions?: SwipeCardProps["setSwipeFunctions"];
}) => {
  const [currentIndex, setCurrentIndex] = useState(user);
  const [isEndReached, setIsEndReached] = useState(false);
  const [swipeLeft, setSwipeLeft] = useState<(() => void) | undefined>();
  const [swipeRight, setSwipeRight] = useState<(() => void) | undefined>();

  const handleSwipe = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= users.length) {
        setIsEndReached(true);
      }
      return nextIndex;
    });
  }, []);

  const handleSetSwipeFunctions = useCallback(
    (left: () => void, right: () => void) => {
      setSwipeLeft(() => left);
      setSwipeRight(() => right);
    },
    []
  );

  React.useEffect(() => {
    setCurrentIndex(user);
  }, [user]);

  React.useEffect(() => {
    if (setSwipeFunctions) {
      setSwipeFunctions(swipeLeft ?? (() => {}), swipeRight ?? (() => {}));
    }
  }, [setSwipeFunctions, swipeLeft, swipeRight]);

  if (isEndReached) {
    return (
      <AnimatedBox
        className="flex-1 justify-center items-center p-4"
        entering={FadeInDown.duration(400)}
      >
        <Box className="items-center gap-6">
          <Heading size="2xl" className="text-center">
            You've reached the end!
          </Heading>
          <Text className="text-typography-500 text-center">
            There are no more profiles to show right now. Check back later for
            new matches!
          </Text>
        </Box>
      </AnimatedBox>
    );
  }

  return (
    <AnimatedBox
      className="flex-1"
      entering={FadeInDown.duration(400).delay(400)}
    >
      {users
        .slice(currentIndex, currentIndex + 3)
        .map((_, index) => {
          const actualIndex = currentIndex + index;
          return (
            <SwipeCard
              key={actualIndex}
              user={actualIndex}
              onSwipeLeft={handleSwipe}
              onSwipeRight={handleSwipe}
              setSwipeFunctions={
                index === 0 ? handleSetSwipeFunctions : undefined
              }
            />
          );
        })
        .reverse()}
      <ChooseButtonLayout onSwipeLeft={swipeLeft} onSwipeRight={swipeRight} />
    </AnimatedBox>
  );
};

export default SwipeScreen;
