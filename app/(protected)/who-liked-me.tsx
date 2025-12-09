import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon, ArrowLeftIcon } from "@/components/ui/icon";
import { FlatList, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToUsersWhoLikedMe, Like } from "@/services/likes";
import Animated, { FadeInDown } from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on sides and 16px gap

const WhoLikedMeScreen = () => {
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToUsersWhoLikedMe((updatedLikes) => {
      setLikes(updatedLikes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderLikeCard = ({ item, index }: { item: Like; index: number }) => {
    const userName = `${item.userData.firstName} ${item.userData.lastName}`.trim();

    return (
      <AnimatedBox
        entering={FadeInDown.delay(index * 50).duration(400)}
        className="mb-4"
        style={{ width: CARD_WIDTH }}
      >
        <Pressable
          onPress={() => {
            router.push({
              pathname: "/(protected)/user-profile/[id]" as any,
              params: { id: item.userId },
            });
          }}
        >
          <Box className="bg-background-50 rounded-2xl overflow-hidden border border-background-200">
            {/* Profile Image */}
            <Box className="w-full aspect-square bg-background-200 items-center justify-center">
              {item.userData.profileImage ? (
                <Image
                  source={{ uri: item.userData.profileImage }}
                  className="w-full h-full"
                  alt={userName}
                />
              ) : (
                <Text className="text-5xl font-roboto font-semibold text-typography-500">
                  {item.userData.firstName?.charAt(0) || "U"}
                </Text>
              )}
            </Box>

            {/* User Info */}
            <VStack className="p-3">
              <Heading size="sm" className="font-roboto font-semibold" numberOfLines={1}>
                {userName}
              </Heading>
              <Text className="text-typography-500 text-sm font-roboto mb-2">
                {item.userData.age} years old
              </Text>

              {item.userData.bio && (
                <Text
                  className="text-typography-700 text-xs font-roboto mb-2"
                  numberOfLines={2}
                >
                  {item.userData.bio}
                </Text>
              )}

              {item.userData.interests && item.userData.interests.length > 0 && (
                <HStack className="flex-wrap gap-1">
                  {item.userData.interests.slice(0, 2).map((interest, idx) => (
                    <Box
                      key={idx}
                      className="bg-background-100 rounded-full px-2 py-1"
                    >
                      <Text className="text-typography-600 text-xs font-roboto">
                        {interest}
                      </Text>
                    </Box>
                  ))}
                  {item.userData.interests.length > 2 && (
                    <Box className="bg-background-100 rounded-full px-2 py-1">
                      <Text className="text-typography-600 text-xs font-roboto">
                        +{item.userData.interests.length - 2}
                      </Text>
                    </Box>
                  )}
                </HStack>
              )}
            </VStack>
          </Box>
        </Pressable>
      </AnimatedBox>
    );
  };

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box
        className="bg-background-0 border-b border-background-100 px-4 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <HStack className="items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Icon as={ArrowLeftIcon} className="w-6 h-6 text-typography-900" />
          </Pressable>
          <VStack className="flex-1">
            <Heading size="xl" className="font-satoshi font-bold">
              Who Liked You
            </Heading>
            {!loading && likes.length > 0 && (
              <Text className="text-typography-500 text-sm font-roboto">
                {likes.length} {likes.length === 1 ? "person" : "people"} liked you
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="text-typography-500 mt-4 font-roboto">
            Loading...
          </Text>
        </Box>
      ) : likes.length === 0 ? (
        <AnimatedBox
          entering={FadeInDown.duration(400)}
          className="flex-1 items-center justify-center p-8"
        >
          <Text className="text-6xl mb-4">💝</Text>
          <Heading size="xl" className="text-center mb-2 font-roboto">
            No likes yet
          </Heading>
          <Text className="text-typography-500 text-center font-roboto mb-6">
            Keep swiping to find matches! When someone likes your profile,
            they'll appear here.
          </Text>
          <Button
            onPress={() => router.back()}
            className="bg-primary-500 rounded-full px-8"
          >
            <ButtonText className="font-roboto font-semibold">
              Start Swiping
            </ButtonText>
          </Button>
        </AnimatedBox>
      ) : (
        <FlatList
          data={likes}
          renderItem={renderLikeCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Box>
  );
};

export default WhoLikedMeScreen;
