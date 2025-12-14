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

const AnimatedBox = Animated.createAnimatedComponent(Box);
function Header() {
  return (
    <Box className="w-full flex flex-col p-4 gap-2">
      <Box className="flex flex-row items-center gap-2">
        <Icon as={LogoIcon} className="w-7 h-7" />
        <Heading size="xl" className="font-satoshi">
          Dular
        </Heading>
      </Box>
    </Box>
  );
}

function FilterLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState<string | undefined>(undefined);
  const defaultOpenProp = defaultOpen && {
    defaultOpen: [defaultOpen?.toLocaleLowerCase().replace(" ", "-")],
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
          {["Age", "Distance", "Looking For"].map((item) => (
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
