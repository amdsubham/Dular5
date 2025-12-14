import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { FlatList, Pressable, ActivityIndicator, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser } from "@/services/auth";
import { subscribeToChats, Chat } from "@/services/messaging";
import { subscribeToUserStatus } from "@/services/presence";
import { getLikesCount } from "@/services/likes";
import Animated, { FadeInDown } from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

const MatchesScreen = () => {
  const insets = useSafeAreaInsets();
  const currentUser = getCurrentUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState<{ [userId: string]: boolean }>({});
  const [likesCount, setLikesCount] = useState<number>(0);

  useEffect(() => {
    // Subscribe to chats for real-time updates
    const unsubscribe = subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch likes count
  useEffect(() => {
    const fetchLikesCount = async () => {
      const count = await getLikesCount();
      setLikesCount(count);
    };
    fetchLikesCount();
  }, []);

  // Subscribe to online status for all chat participants
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    chats.forEach((chat) => {
      const otherUserId = chat.participants.find((id) => id !== currentUser?.uid);
      if (otherUserId) {
        const unsubscribe = subscribeToUserStatus(
          otherUserId,
          (isOnline) => {
            setOnlineStatus((prev) => ({
              ...prev,
              [otherUserId]: isOnline,
            }));
          }
        );
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [chats, currentUser]);

  const getOtherUser = (chat: Chat) => {
    const otherUserId = chat.participants.find((id) => id !== currentUser?.uid);
    return otherUserId ? chat.participantsData[otherUserId] : null;
  };

  const getUnreadCount = (chat: Chat): number => {
    if (!currentUser) return 0;
    return chat.unreadCount[currentUser.uid] || 0;
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? "Just now" : `${minutes}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const renderMatchItem = ({ item }: { item: Chat }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const unreadCount = getUnreadCount(item);
    const userName = `${otherUser.firstName} ${otherUser.lastName}`.trim();
    const otherUserId = item.participants.find((id) => id !== currentUser?.uid);

    if (!otherUserId) {
      console.warn('No otherUserId found for chat:', item.id);
      return null;
    }

    const handlePress = () => {
      console.log('🔵 Match item pressed');
      console.log('Opening chat with params:', {
        chatId: item.id,
        userId: otherUserId,
        userName,
      });

      try {
        router.push({
          pathname: "/(protected)/chat/[id]" as any,
          params: {
            id: item.id,
            userId: otherUserId,
            userName,
          },
        });
        console.log('✅ Navigation triggered successfully');
      } catch (error) {
        console.error('❌ Navigation error:', error);
      }
    };

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Box className="flex-row items-center px-4 py-3 border-b border-background-100">
          <Box className="relative mr-3">
            <Box className="w-16 h-16 rounded-full overflow-hidden bg-background-200 items-center justify-center">
              {otherUser.profileImage ? (
                <Image
                  source={{ uri: otherUser.profileImage }}
                  className="w-full h-full"
                  alt={userName}
                />
              ) : (
                <Text className="text-2xl font-roboto font-semibold">
                  {otherUser.firstName?.charAt(0) || "U"}
                </Text>
              )}
            </Box>
            {onlineStatus[otherUserId] && (
              <Box className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success-500 border-2 border-background-0" />
            )}
          </Box>

          <VStack className="flex-1">
            <HStack className="items-center justify-between mb-1">
              <Heading size="sm" className="font-roboto font-semibold flex-1">
                {userName}
              </Heading>
              <Text className="text-typography-400 text-xs font-roboto">
                {formatTime(item.lastMessageAt)}
              </Text>
            </HStack>

            <HStack className="items-center">
              <Text
                className={`flex-1 font-roboto text-sm ${
                  unreadCount > 0
                    ? "text-typography-900 font-medium"
                    : "text-typography-500"
                }`}
                numberOfLines={1}
              >
                {item.lastMessage || "Say hi! 👋"}
              </Text>
              {unreadCount > 0 && (
                <Box className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center ml-2">
                  <Text className="text-white text-xs font-roboto font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </Box>
              )}
            </HStack>
          </VStack>
        </Box>
      </TouchableOpacity>
    );
  };

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box
        className="bg-background-0 border-b border-background-100 px-4 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <HStack className="items-center justify-between mb-3">
          <Heading size="2xl" className="font-satoshi font-bold">
            Matches
          </Heading>
          {likesCount > 0 && (
            <Pressable
              onPress={() => router.push("/(protected)/who-liked-me" as any)}
              className="bg-primary-500 rounded-full px-4 py-2 flex-row items-center gap-2"
            >
              <Text className="text-white font-roboto font-semibold text-sm">
                {likesCount} {likesCount === 1 ? "Like" : "Likes"}
              </Text>
              <Text className="text-white text-lg">💝</Text>
            </Pressable>
          )}
        </HStack>
        {likesCount > 0 && (
          <Text className="text-typography-500 text-sm font-roboto">
            {likesCount} {likesCount === 1 ? "person" : "people"} liked your profile
          </Text>
        )}
      </Box>

      {/* Matches List */}
      {loading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="text-typography-500 mt-4 font-roboto">
            Loading matches...
          </Text>
        </Box>
      ) : chats.length === 0 ? (
        <AnimatedBox
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center p-8"
        >
          <Text className="text-6xl mb-4">💬</Text>
          <Heading size="xl" className="text-center mb-2 font-roboto">
            No matches yet
          </Heading>
          <Text className="text-typography-500 text-center font-roboto">
            Start swiping to find matches and start conversations!
          </Text>
        </AnimatedBox>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
};

export default MatchesScreen;
