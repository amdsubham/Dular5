import React, { useCallback, useState, useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ThreeDotsIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { ScrollView } from "@/components/ui/scroll-view";
import { Badge } from "@/components/ui/badge";
import { ImageBackground } from "@/components/ui/image-background";
import { Image } from "@/components/ui/image";
import { LinearGradient } from "expo-linear-gradient";
import { LocationBadge, LoveBadge } from "@/components/shared/badge";
import { Text } from "@/components/ui/text";
import { HeartIcon } from "@/components/shared/icons";
import { CloseIcon } from "@/components/ui/icon";
import { LoveMatchBottomSheet } from "@/components/screens/home/love-match";
import { fetchPotentialMatches, recordSwipeAction, MatchUser, MatchResult } from "@/services/matching";
import { ActivityIndicator } from "react-native";
import { MatchModal, MatchData } from "@/components/screens/home/match-modal";
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
  userData: MatchUser;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  setSwipeFunctions?: (left: () => void, right: () => void) => void;
};

const SwipeCard = ({
  userData,
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

  const displayName = `${userData.firstName} ${userData.lastName}`.trim() || "User";

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
                {displayName}, {userData.age}
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

            {/* Main Profile Image */}
            {userData.pictures && userData.pictures[0] ? (
              <ImageBackground
                source={{ uri: userData.pictures[0] }}
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
            ) : (
              <Box className="w-full rounded-lg aspect-[0.8] bg-background-100 items-center justify-center">
                <Image
                  source={require("@/assets/images/common/profile_avatar.png")}
                  className="w-32 h-32"
                  alt="profile"
                />
              </Box>
            )}

            {/* Interests */}
            {userData.interests && userData.interests.length > 0 && (
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
            )}

            {/* Additional Images */}
            {userData.pictures && userData.pictures.slice(1, 5).map((imageUrl, index) => (
              imageUrl ? (
                <ImageBackground
                  key={index}
                  source={{ uri: imageUrl }}
                  className="w-full rounded-lg aspect-square overflow-hidden"
                />
              ) : null
            ))}
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
  setSwipeFunctions,
  filters,
}: {
  setSwipeFunctions?: (left: () => void, right: () => void) => void;
  filters?: {
    minAge: number;
    maxAge: number;
    maxDistance: number;
    lookingFor: string[];
    interestedIn: string[];
  };
}) => {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEndReached, setIsEndReached] = useState(false);
  const [swipeLeft, setSwipeLeft] = useState<(() => void) | undefined>();
  const [swipeRight, setSwipeRight] = useState<(() => void) | undefined>();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  // Fetch potential matches on component mount and when filters change
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const potentialMatches = await fetchPotentialMatches({
          maxDistance: filters?.maxDistance || 100,
          minAge: filters?.minAge || 18,
          maxAge: filters?.maxAge || 99,
        });
        setMatches(potentialMatches);
        setCurrentIndex(0);
        if (potentialMatches.length === 0) {
          setIsEndReached(true);
        } else {
          setIsEndReached(false);
        }
      } catch (error) {
        console.error("Error loading matches:", error);
        setIsEndReached(true);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [filters?.minAge, filters?.maxAge, filters?.maxDistance]);

  const handleSwipe = useCallback(
    async (action: "like" | "pass") => {
      const currentUser = matches[currentIndex];
      if (currentUser) {
        // Record the swipe action
        const result: MatchResult = await recordSwipeAction(currentUser.uid, action);

        // Check if it's a match
        if (result.isMatch && result.matchData && result.matchId) {
          setMatchData({
            matchId: result.matchId,
            matchedUser: result.matchData.matchedUser,
            currentUser: result.matchData.currentUser,
          });
          setMatchModalVisible(true);
        }
      }

      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= matches.length) {
          setIsEndReached(true);
        }
        return nextIndex;
      });
    },
    [currentIndex, matches]
  );

  const handleSetSwipeFunctions = useCallback(
    (left: () => void, right: () => void) => {
      setSwipeLeft(() => left);
      setSwipeRight(() => right);
    },
    []
  );

  React.useEffect(() => {
    if (setSwipeFunctions) {
      setSwipeFunctions(swipeLeft ?? (() => {}), swipeRight ?? (() => {}));
    }
  }, [setSwipeFunctions, swipeLeft, swipeRight]);

  if (loading) {
    return (
      <AnimatedBox
        className="flex-1 justify-center items-center"
        entering={FadeInDown.duration(400)}
      >
        <ActivityIndicator size="large" />
        <Text className="text-typography-500 mt-4">Finding matches near you...</Text>
      </AnimatedBox>
    );
  }

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
    <>
      <AnimatedBox
        className="flex-1"
        entering={FadeInDown.duration(400).delay(400)}
      >
        {matches
          .slice(currentIndex, currentIndex + 3)
          .map((matchUser, index) => {
            return (
              <SwipeCard
                key={matchUser.uid}
                userData={matchUser}
                onSwipeLeft={() => handleSwipe("pass")}
                onSwipeRight={() => handleSwipe("like")}
                setSwipeFunctions={
                  index === 0 ? handleSetSwipeFunctions : undefined
                }
              />
            );
          })
          .reverse()}
        <ChooseButtonLayout
          onSwipeLeft={() => {
            if (swipeLeft) swipeLeft();
          }}
          onSwipeRight={() => {
            if (swipeRight) swipeRight();
          }}
        />
      </AnimatedBox>

      {/* Match Modal */}
      <MatchModal
        visible={matchModalVisible}
        matchData={matchData}
        onClose={() => setMatchModalVisible(false)}
      />
    </>
  );
};

export default SwipeScreen;
