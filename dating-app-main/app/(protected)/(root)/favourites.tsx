import React, { useState } from "react";
import { useRouter } from "expo-router";
import { FilterIcon } from "@/components/shared/icons";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScrollView } from "@/components/ui/scroll-view";
import { ImageBackground } from "@/components/ui/image-background";
import { Pressable } from "@/components/ui/pressable";
import { LocationBadge, LoveBadge } from "@/components/shared/badge";
import { LinearGradient } from "expo-linear-gradient";
import { matches } from "@/data/data";
import Animated, {
  FadeIn,
  SlideInRight,
  ZoomIn,
} from "react-native-reanimated";
const AnimatedBox = Animated.createAnimatedComponent(Box);

const images = [
  require("@/assets/images/common/profile_1_preview.png"),
  require("@/assets/images/common/profile_2_preview.png"),
  require("@/assets/images/common/profile_3_preview.png"),
  require("@/assets/images/common/profile_4_preview.png"),
  require("@/assets/images/common/profile_5_preview.png"),
  require("@/assets/images/common/profile_1_preview.png"),
];

function FilterButton({
  isSelected = false,
  children,
  onPress,
}: {
  isSelected?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Button
      className={
        "px-4 py-2 rounded-3xl " +
        (isSelected
          ? ""
          : "bg-background-50 data-[active=true]:bg-background-100")
      }
      size="sm"
      onPress={onPress}
    >
      <ButtonText className="text-white data-[active=true]:text-white">
        {children}
      </ButtonText>
    </Button>
  );
}

function FilterLayout({
  selected,
  setSelected,
}: {
  selected: string;
  setSelected: (value: string) => void;
}) {
  return (
    <AnimatedBox
      entering={SlideInRight}
      className="flex flex-row items-center pl-4 mb-4"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Box className="flex flex-row items-center gap-3">
          {["All", "Online", "Nearest", "Newest"].map((item) => (
            <FilterButton
              key={item}
              isSelected={selected === item}
              onPress={() => setSelected(item)}
            >
              {item}
            </FilterButton>
          ))}
        </Box>
      </ScrollView>
    </AnimatedBox>
  );
}

function Header() {
  return (
    <AnimatedBox
      entering={FadeIn}
      className="w-full flex flex-row items-center p-4 gap-2 justify-between"
    >
      <Text size="2xl" className="font-satoshi font-medium">
        My Matches
      </Text>
      <Box className="flex flex-row gap-3 items-center">
        <Button
          className="p-0 h-10 w-10 rounded-full bg-background-50 data-[active=true]:bg-background-100"
          variant="link"
        >
          <ButtonIcon
            as={SearchIcon}
            className="w-[18px] h-[18px] text-white"
          />
        </Button>
        <Button
          className="p-0 h-[35px] w-[35px] bg-background-50 data-[active=true]:bg-background-100"
          variant="link"
        >
          <ButtonIcon
            as={FilterIcon}
            className="w-[18px] h-[18px] text-white"
          />
        </Button>
      </Box>
    </AnimatedBox>
  );
}

function MatchCard({
  match,
  index,
}: {
  match: (typeof matches)[0];
  index: number;
}) {
  const router = useRouter();
  return (
    <Box className="w-full gap-y-2.5 rounded-t-lg overflow-hidden">
      <Box className="rounded-lg overflow-hidden">
        <Pressable onPress={() => router.push(`/messages/${match.id}`)}>
          <ImageBackground
            source={images[index % images.length]}
            className="aspect-[0.86]"
            alt={match.name}
          >
            <LinearGradient
              colors={["#00000000", "#00000088"]}
              className="flex flex-row items-end justify-center gap-x-1 p-2.5 mt-auto"
            >
              <LoveBadge lovePercentage={match.love} />
              <LocationBadge distance={match.distance} />
            </LinearGradient>
          </ImageBackground>
        </Pressable>
      </Box>
      <Box className="flex flex-row items-center gap-2.5">
        <Box
          className={`rounded-full h-1.5 w-1.5 ${
            match.online ? "bg-green-500" : "bg-background-400"
          }`}
        />
        <Text size="sm" className="font-roboto leading-4">
          {match.name + ", " + match.age}
        </Text>
      </Box>
    </Box>
  );
}

function MatchesLayout() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Box className="flex-row gap-y-4 px-4 flex-wrap w-full justify-between">
        {matches.map((match, index) => {
          return (
            <AnimatedBox
              entering={ZoomIn.delay((index + 1) * 100)}
              className="w-[48.5%]"
              key={match.name}
            >
              <MatchCard match={match} index={index} />
            </AnimatedBox>
          );
        })}
      </Box>
    </ScrollView>
  );
}

export default function Index() {
  const [selected, setSelected] = useState<string>("All");
  return (
    <>
      <Header />
      <FilterLayout selected={selected} setSelected={setSelected} />
      <MatchesLayout />
    </>
  );
}
