import React, { useState, useEffect } from "react";
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
import { Image } from "@/components/ui/image";
import { ActivityIndicator } from "react-native";
import { getCurrentUser } from "@/services/auth";
import { subscribeToChats, Chat } from "@/services/messaging";
import Animated, {
  FadeIn,
  SlideInRight,
  ZoomIn,
  FadeInDown,
} from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

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
          {["All", "Online", "Newest"].map((item) => (
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
  chat,
  index,
}: {
  chat: Chat;
  index: number;
}) {
  const router = useRouter();
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  // Get the other user's data
  const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
  if (!otherUserId) return null;

  const otherUser = chat.participantsData[otherUserId];
  if (!otherUser) return null;

  const userName = `${otherUser.firstName} ${otherUser.lastName}`.trim();
  const profileImage = otherUser.profileImage;

  // Calculate dummy love percentage and distance (you can replace with real data)
  const lovePercentage = 85; // Default value
  const distance = 5; // Default 5km

  const handlePress = () => {
    console.log('🔵 Match card pressed');
    router.push({
      pathname: "/(protected)/chat/[id]" as any,
      params: {
        id: chat.id,
        userId: otherUserId,
        userName,
      },
    });
  };

  return (
    <Box className="w-full gap-y-2.5 rounded-t-lg overflow-hidden">
      <Box className="rounded-lg overflow-hidden">
        <Pressable onPress={handlePress}>
          {profileImage ? (
            <ImageBackground
              source={{ uri: profileImage }}
              className="aspect-[0.86]"
              alt={userName}
            >
              <LinearGradient
                colors={["#00000000", "#00000088"]}
                className="flex flex-row items-end justify-center gap-x-1 p-2.5 mt-auto"
              >
                <LoveBadge lovePercentage={lovePercentage} />
                <LocationBadge distance={distance} />
              </LinearGradient>
            </ImageBackground>
          ) : (
            <Box className="aspect-[0.86] bg-background-200 items-center justify-center">
              <Text className="text-6xl font-roboto">
                {otherUser.firstName?.charAt(0) || "?"}
              </Text>
              <LinearGradient
                colors={["#00000000", "#00000088"]}
                className="flex flex-row items-end justify-center gap-x-1 p-2.5 mt-auto absolute bottom-0 left-0 right-0"
              >
                <LoveBadge lovePercentage={lovePercentage} />
                <LocationBadge distance={distance} />
              </LinearGradient>
            </Box>
          )}
        </Pressable>
      </Box>
      <Box className="flex flex-row items-center gap-2.5">
        <Box className="rounded-full h-1.5 w-1.5 bg-green-500" />
        <Text size="sm" className="font-roboto leading-4">
          {userName}
        </Text>
      </Box>
    </Box>
  );
}

function MatchesLayout({ chats, filter }: { chats: Chat[]; filter: string }) {
  // Filter chats based on selected filter
  const filteredChats = chats.filter((chat) => {
    if (filter === "All") return true;
    if (filter === "Online") return true; // You can add online status logic
    if (filter === "Newest") return true; // You can add sorting logic
    return true;
  });

  if (filteredChats.length === 0) {
    return (
      <AnimatedBox
        entering={FadeInDown.duration(400)}
        className="flex-1 items-center justify-center p-8 mt-20"
      >
        <Text className="text-6xl mb-4">💝</Text>
        <Text size="xl" className="text-center mb-2 font-roboto font-semibold">
          No matches yet
        </Text>
        <Text className="text-typography-500 text-center font-roboto">
          Start swiping to find matches and start conversations!
        </Text>
      </AnimatedBox>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Box className="flex-row gap-y-4 px-4 flex-wrap w-full justify-between">
        {filteredChats.map((chat, index) => {
          return (
            <AnimatedBox
              entering={ZoomIn.delay((index + 1) * 100)}
              className="w-[48.5%]"
              key={chat.id}
            >
              <MatchCard chat={chat} index={index} />
            </AnimatedBox>
          );
        })}
      </Box>
    </ScrollView>
  );
}

export default function MatchesScreen() {
  const [selected, setSelected] = useState<string>("All");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to chats for real-time updates
    const unsubscribe = subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-typography-500 mt-4 font-roboto">
          Loading matches...
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Header />
      <FilterLayout selected={selected} setSelected={setSelected} />
      <MatchesLayout chats={chats} filter={selected} />
    </>
  );
}
