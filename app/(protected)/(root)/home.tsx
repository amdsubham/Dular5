import React, { useState, useCallback, useEffect } from "react";
import { Pressable } from "react-native";
import { FilterIcon, LogoIcon } from "@/components/shared/icons";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { FilterBottomSheet } from "@/components/screens/home/filter";
import Animated, { FadeInRight } from "react-native-reanimated";
import SwipeScreen from "@/components/screens/home/swipe-screen/index-firestore";
import { useFilters } from "@/contexts/FilterContext";
import { fixCurrentUserOnboarding } from "@/services/fix-onboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown } from "lucide-react-native";

const AnimatedBox = Animated.createAnimatedComponent(Box);
function Header() {
  const { subscription, isPremium, subscriptionEnabled } = useSubscription();

  // Get current plan display name
  const getPlanDisplayName = () => {
    // Don't show premium badge if subscriptions are disabled
    if (!subscriptionEnabled) return null;
    if (!subscription || !isPremium) return null;

    const currentPlan = subscription.currentPlan || "daily";
    switch (currentPlan) {
      case "daily":
        return "Daily Premium";
      case "weekly":
        return "Weekly Premium";
      case "monthly":
        return "Monthly Premium";
      default:
        return "Premium";
    }
  };

  const planName = getPlanDisplayName();

  return (
    <Box className="w-full flex flex-col p-4 gap-2">
      <Box className="flex flex-row items-center justify-between">
        <Box className="flex flex-row items-center gap-2">
          <Icon as={LogoIcon} className="w-7 h-7" />
          <Heading size="xl" className="font-satoshi">
            Dular
          </Heading>
        </Box>

        {planName && (
          <Box className="flex flex-row items-center gap-1.5 bg-primary-500/10 px-3 py-1.5 rounded-full">
            <Icon as={Crown} size="xs" className="text-primary-500" />
            <Text className="text-primary-500 text-xs font-semibold font-roboto">
              {planName}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function FilterLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState<string | undefined>(undefined);

  // Map filter names to accordion keys
  const getAccordionKey = (filterName: string) => {
    const mapping: { [key: string]: string } = {
      "Gender": "gender",
      "Age": "age",
      "Distance": "distance",
      "Looking For": "looking-for"
    };
    return mapping[filterName] || filterName.toLowerCase().replace(" ", "-");
  };

  const defaultOpenProp = defaultOpen && {
    defaultOpen: [getAccordionKey(defaultOpen)],
  };
  return (
    <AnimatedBox
      entering={FadeInRight.duration(500)}
      className="flex flex-row items-center mb-4"
    >
      <Pressable
        className="rounded-md flex items-center justify-center mr-2 p-4"
        onPress={() => {
          setDefaultOpen(undefined);
          setIsOpen(true);
        }}
      >
        <Icon as={FilterIcon} className="w-4 h-4" />
      </Pressable>
      <FilterBottomSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        {...defaultOpenProp}
      />
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
      >
        <Box className="flex flex-row items-center">
          {["Gender", "Age", "Distance", "Looking For"].map((item) => (
            <Button
              className="px-3 py-2 rounded-3xl mr-2 bg-background-50 data-[active=true]:bg-background-100"
              size="sm"
              key={item}
              onPress={() => {
                setDefaultOpen(item);
                setIsOpen(true);
              }}
            >
              <ButtonText className="text-typography-950 data-[active=true]:text-typography-900">
                {item}
              </ButtonText>
              <ButtonIcon
                className="text-typography-950"
                as={ChevronDownIcon}
              />
            </Button>
          ))}
        </Box>
      </ScrollView>
    </AnimatedBox>
  );
}

function ExploreLayout() {
  const [swipeLeft, setSwipeLeft] = useState<(() => void) | undefined>();
  const [swipeRight, setSwipeRight] = useState<(() => void) | undefined>();
  const { filters } = useFilters();

  const handleSetSwipeFunctions = useCallback(
    (left: () => void, right: () => void) => {
      setSwipeLeft(() => left);
      setSwipeRight(() => right);
    },
    []
  );

  return (
    <>
      <SwipeScreen
        setSwipeFunctions={handleSetSwipeFunctions}
        filters={filters}
      />
    </>
  );
}

export default function Index() {
  // Auto-fix onboarding.completed flag if needed
  useEffect(() => {
    fixCurrentUserOnboarding().catch(console.error);
  }, []);

  return (
    <>
      <Header />
      <Box className="pt-2 pb-4 flex-col flex-1">
        <FilterLayout />
        <ExploreLayout />
      </Box>
    </>
  );
}
