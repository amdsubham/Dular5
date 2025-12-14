import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { CloseIcon, SearchIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import Animated, { FadeInDown, FadeInRight, SlideInRight } from "react-native-reanimated";
import { subscribeToChats, Chat } from "@/services/messaging";
import { getCurrentUser } from "@/services/auth";
import { formatTimeAgo } from "@/utils/timeUtils";
import { EmptyState } from "@/components/shared/EmptyState";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBox = Animated.createAnimatedComponent(Box);

// Default fallback image
const defaultImage = require("@/assets/images/common/profile_avatar.png");

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
            placeholder="Search chats..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-white placeholder:text-typography-400"
          />
          {searchQuery.length > 0 && (
            <InputSlot className="pr-3" onPress={() => setSearchQuery("")}>
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
        <ButtonIcon as={CloseIcon} className="w-[18px] h-[18px] text-white" />
      </Button>
    </AnimatedBox>
  );
}

function Header({
  onSearchToggle,
  showSearch,
}: {
  onSearchToggle: () => void;
  showSearch: boolean;
}) {
  return (
    <Box className="w-full flex flex-row items-center p-4 gap-2 justify-between mb-1">
      <Text size="2xl" className="font-satoshi font-medium">
        Chats
      </Text>
      <Button
        className="p-0 h-10 w-10 rounded-full bg-background-50 data-[active=true]:bg-background-100"
        variant="link"
        onPress={onSearchToggle}
      >
        <ButtonIcon as={SearchIcon} className="w-[18px] h-[18px] text-white" />
      </Button>
    </Box>
  );
}

function ChatProfiles({ chats }: { chats: Chat[] }) {
  const router = useRouter();
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  // Filter only online users
  const onlineChats = chats.filter((chat) => {
    const otherUserId = chat.participants.find((id) => id !== currentUser.uid);
    if (!otherUserId) return false;
    const otherUser = chat.participantsData[otherUserId];
    return otherUser?.isOnline === true;
  });

  if (onlineChats.length === 0) return null;

  return (
    <Box className="flex flex-col gap-3">
      <Text className="font-roboto px-4">Online Now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Box className="flex flex-row gap-3 mx-4">
          {onlineChats.map((chat, index) => {
            const otherUserId = chat.participants.find(
              (id) => id !== currentUser.uid
            );
            if (!otherUserId) return null;

            const otherUser = chat.participantsData[otherUserId];
            if (!otherUser) return null;

            const userName = otherUser.firstName;

            return (
              <AnimatedPressable
                entering={FadeInRight.delay(index * 100)}
                className="bg-background-50 rounded-lg p-1.5 items-center gap-2.5 w-[84px] h-[84px] data-[active=true]:bg-background-100"
                key={chat.id}
                onPress={() => {
                  const fullName = `${otherUser.firstName}${
                    otherUser.lastName ? ` ${otherUser.lastName}` : ""
                  }`;
                  router.push(
                    `/chat/${chat.id}?userId=${otherUserId}&userName=${encodeURIComponent(
                      fullName
                    )}`
                  );
                }}
              >
                <Box className="relative">
                  {otherUser.profileImage ? (
                    <Image
                      source={{ uri: otherUser.profileImage }}
                      className="h-12 w-12 rounded-full overflow-hidden"
                      alt={userName}
                    />
                  ) : (
                    <Image
                      source={defaultImage}
                      className="h-12 w-12 rounded-full overflow-hidden"
                      alt={userName}
                    />
                  )}
                  <Box className="absolute bottom-0 right-0 bg-green-500 rounded-full w-2.5 h-2.5" />
                </Box>
                <Text size="xs" className="font-roboto text-center">
                  {userName}
                </Text>
              </AnimatedPressable>
            );
          })}
        </Box>
      </ScrollView>
    </Box>
  );
}

function ChatsList({ chats }: { chats: Chat[] }) {
  const router = useRouter();
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  return (
    <Box className="flex flex-col gap-[18px] mt-2 p-4 pb-0 flex-1">
      <Text className="font-roboto">Recent Chats</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box className="flex flex-col gap-2 mb-2">
          {chats.map((chat, index) => {
            const otherUserId = chat.participants.find(
              (id) => id !== currentUser.uid
            );
            if (!otherUserId) return null;

            const otherUser = chat.participantsData[otherUserId];
            if (!otherUser) return null;

            const userName = otherUser.firstName;
            const lastMessage = chat.lastMessage || "No messages yet";
            const unreadCount = chat.unreadCount[currentUser.uid] || 0;

            // Format timestamp
            let timeAgo = "";
            if (chat.lastMessageAt) {
              try {
                timeAgo = formatTimeAgo(chat.lastMessageAt);
              } catch (error) {
                timeAgo = "now";
              }
            }

            return (
              <AnimatedPressable
                entering={FadeInDown.delay((index + 5) * 100)}
                className="bg-background-50 rounded-lg p-4 gap-3 items-center flex-row justify-between w-full h-[84px] data-[active=true]:bg-background-100"
                key={chat.id}
                onPress={() => {
                  const fullName = `${otherUser.firstName}${
                    otherUser.lastName ? ` ${otherUser.lastName}` : ""
                  }`;
                  router.push(
                    `/chat/${chat.id}?userId=${otherUserId}&userName=${encodeURIComponent(
                      fullName
                    )}`
                  );
                }}
              >
                <Box className="flex flex-row items-center gap-3 flex-1">
                  {otherUser.profileImage ? (
                    <Image
                      source={{ uri: otherUser.profileImage }}
                      className="h-12 w-12 rounded-full overflow-hidden"
                      alt={userName}
                    />
                  ) : (
                    <Image
                      source={defaultImage}
                      className="h-12 w-12 rounded-full overflow-hidden"
                      alt={userName}
                    />
                  )}
                  <Box className="flex flex-col gap-1 flex-1">
                    <Text
                      className="font-roboto font-bold"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {userName}
                    </Text>
                    <Text size="sm" className="font-roboto" numberOfLines={1}>
                      {lastMessage}
                    </Text>
                  </Box>
                </Box>
                <Box className="flex flex-col-reverse items-end h-full justify-between">
                  <Text
                    size="xs"
                    className="font-roboto text-xs text-typography-400"
                  >
                    {timeAgo}
                  </Text>
                  {unreadCount > 0 && (
                    <Text
                      size="xs"
                      className="font-roboto text-[10px] p-1 px-2 rounded-md bg-primary-500"
                    >
                      {unreadCount}
                    </Text>
                  )}
                </Box>
              </AnimatedPressable>
            );
          })}
        </Box>
      </ScrollView>
    </Box>
  );
}

export default function Index() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;

    console.log("🔄 Subscribing to chats...");
    const unsubscribe = subscribeToChats((updatedChats) => {
      console.log(`✅ Received ${updatedChats.length} chats`);
      setChats(updatedChats);
      setLoading(false);
    });

    return () => {
      console.log("🔴 Unsubscribing from chats");
      unsubscribe();
    };
  }, []);

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      // Close search and clear query
      setSearchQuery("");
    }
  };

  // Filter chats based on search query
  let filteredChats = [...chats];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredChats = filteredChats.filter((chat) => {
      const otherUserId = chat.participants.find(
        (id) => id !== currentUser?.uid
      );
      if (!otherUserId) return false;

      const otherUser = chat.participantsData[otherUserId];
      if (!otherUser) return false;

      const userName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
      const lastMessage = (chat.lastMessage || "").toLowerCase();

      return userName.includes(query) || lastMessage.includes(query);
    });
  }

  if (loading) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center">
        <Text className="font-roboto text-typography-400">Loading chats...</Text>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center">
        <Text className="font-roboto text-typography-400">
          Please log in to view chats
        </Text>
      </Box>
    );
  }

  // Empty state when no chats
  if (filteredChats.length === 0 && !loading) {
    return (
      <Box className="flex-1 bg-background-0">
        <Header onSearchToggle={handleSearchToggle} showSearch={showSearch} />
        {showSearch && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={handleSearchToggle}
          />
        )}
        <EmptyState
          icon="💬"
          title="No Chats Yet"
          description="When you match with someone, you can start chatting with them here. Start swiping to find your perfect match!"
          gradientColors={["#4CAF50", "#2E7D32"]}
        />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-0">
      <Header onSearchToggle={handleSearchToggle} showSearch={showSearch} />
      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={handleSearchToggle}
        />
      )}
      <ChatProfiles chats={filteredChats} />
      <ChatsList chats={filteredChats} />
    </Box>
  );
}
