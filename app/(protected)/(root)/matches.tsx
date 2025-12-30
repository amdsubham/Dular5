import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { FilterIcon } from "@/components/shared/icons";
import { Box } from "@/components/ui/box";
import { analytics } from "@/services/analytics";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { SearchIcon, RepeatIcon, CloseIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { ScrollView } from "@/components/ui/scroll-view";
import { ImageBackground } from "@/components/ui/image-background";
import { Pressable } from "@/components/ui/pressable";
import { LocationBadge, LoveBadge } from "@/components/shared/badge";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "@/components/ui/image";
import { ActivityIndicator } from "react-native";
import { getCurrentUser } from "@/services/auth";
import { subscribeToChats, Chat, getUsersWhoLikedMe } from "@/services/messaging";
import { calculateDistance } from "@/services/location";
import { EmptyState } from "@/components/shared/EmptyState";
import Animated, {
  FadeIn,
  SlideInRight,
  ZoomIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

function AnimatedRefreshIcon({ isRefreshing }: { isRefreshing: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // Infinite repeat
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isRefreshing]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <ButtonIcon
        as={RepeatIcon}
        className="w-[18px] h-[18px] text-white"
      />
    </Animated.View>
  );
}

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
          {["All", "Online", "Newest", "Liked You"].map((item) => (
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

function SearchBar({
  searchQuery,
  setSearchQuery,
  onClose,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatedBox
      entering={SlideInRight}
      className="w-full px-4 pb-3 flex-row items-center gap-2"
    >
      <Box className="flex-1">
        <Input variant="outline" size="md" className="bg-background-50">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} className="text-typography-400" />
          </InputSlot>
          <InputField
            placeholder="Search matches..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-white placeholder:text-typography-400"
          />
          {searchQuery.length > 0 && (
            <InputSlot className="pr-3" onPress={() => setSearchQuery('')}>
              <InputIcon as={CloseIcon} className="text-typography-400" />
            </InputSlot>
          )}
        </Input>
      </Box>
      <Button
        className="p-0 h-10 w-10 rounded-full bg-background-50 data-[active=true]:bg-background-100"
        variant="link"
        onPress={onClose}
      >
        <ButtonIcon
          as={CloseIcon}
          className="w-[18px] h-[18px] text-white"
        />
      </Button>
    </AnimatedBox>
  );
}

function Header({
  onSearchToggle,
  onRefresh,
  isRefreshing,
}: {
  onSearchToggle: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
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
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <AnimatedRefreshIcon isRefreshing={isRefreshing} />
        </Button>
        <Button
          className="p-0 h-10 w-10 rounded-full bg-background-50 data-[active=true]:bg-background-100"
          variant="link"
          onPress={onSearchToggle}
        >
          <ButtonIcon
            as={SearchIcon}
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
  const isOnline = otherUser.isOnline || false;

  // Calculate real distance if location data is available
  let distance = 5; // Default 5km if no location data
  if (currentUser && otherUser.location) {
    // Get current user's location from their user document
    // For now, we'll need to fetch it or pass it from parent
    // Using a placeholder for now - will need to fetch current user location
    const currentUserData = chat.participantsData[currentUser.uid];
    if (currentUserData?.location) {
      distance = Math.round(calculateDistance(
        currentUserData.location.latitude,
        currentUserData.location.longitude,
        otherUser.location.latitude,
        otherUser.location.longitude
      ));
    }
  }

  // Calculate dummy love percentage (you can replace with real data)
  const lovePercentage = 85; // Default value

  const handlePress = () => {
    console.log('🔵 Match card pressed');

    // Track match profile viewed
    analytics.trackMatchProfileViewed(chat.id, otherUserId, {
      user_name: userName,
      is_online: isOnline,
    });

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
        <Box
          className={`rounded-full h-2 w-2 ${
            isOnline ? 'bg-green-500' : 'bg-orange-300'
          }`}
        />
        <Text size="sm" className="font-roboto leading-4">
          {userName}
        </Text>
      </Box>
    </Box>
  );
}

function MatchesLayout({
  chats,
  filter,
  usersWhoLikedMe,
  searchQuery,
}: {
  chats: Chat[];
  filter: string;
  usersWhoLikedMe: string[];
  searchQuery: string;
}) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  // Filter and sort chats based on selected filter
  let filteredChats = [...chats];

  if (filter === "Online") {
    // Filter to show only online users
    filteredChats = filteredChats.filter((chat) => {
      const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
      if (!otherUserId) return false;

      const otherUser = chat.participantsData[otherUserId];
      return otherUser?.isOnline === true;
    });
  } else if (filter === "Newest") {
    // Sort by creation date (newest first)
    filteredChats.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  } else if (filter === "Liked You") {
    // Filter to show only users who liked you
    filteredChats = filteredChats.filter((chat) => {
      const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
      if (!otherUserId) return false;

      return usersWhoLikedMe.includes(otherUserId);
    });
  }
  // "All" filter shows all chats sorted by last message time (default)

  // Apply search filter if search query exists
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredChats = filteredChats.filter((chat) => {
      const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
      if (!otherUserId) return false;

      const otherUser = chat.participantsData[otherUserId];
      if (!otherUser) return false;

      const userName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
      return userName.includes(query);
    });
  }

  if (filteredChats.length === 0) {
    return (
      <EmptyState
        icon="💝"
        title="No Matches Yet"
        description="Start swiping right on profiles you like to make connections and see your matches here!"
        gradientColors={["#FF6B9D", "#C239B3"]}
      />
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
  const [usersWhoLikedMe, setUsersWhoLikedMe] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track screen view when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackMatchListViewed(chats.length, {
        filter_selected: selected,
        users_who_liked_me: usersWhoLikedMe.length,
      });
    }, [chats.length, selected, usersWhoLikedMe.length])
  );

  useEffect(() => {
    // Subscribe to chats for real-time updates
    const unsubscribe = subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    // Fetch users who liked me
    const fetchLikedByUsers = async () => {
      const likedByUserIds = await getUsersWhoLikedMe();
      setUsersWhoLikedMe(likedByUserIds);
    };

    fetchLikedByUsers();

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    console.log('🔄 Refreshing matches...');
    setIsRefreshing(true);

    try {
      // Refetch users who liked me
      const likedByUserIds = await getUsersWhoLikedMe();
      setUsersWhoLikedMe(likedByUserIds);

      console.log('✅ Matches refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing matches:', error);
    } finally {
      // Add a small delay so user can see the refresh animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Clear search when closing
      setSearchQuery("");
    }
  };

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
      <Header
        onSearchToggle={handleSearchToggle}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={handleSearchToggle}
        />
      )}
      <FilterLayout selected={selected} setSelected={setSelected} />
      <MatchesLayout
        chats={chats}
        filter={selected}
        usersWhoLikedMe={usersWhoLikedMe}
        searchQuery={searchQuery}
      />
    </>
  );
}
