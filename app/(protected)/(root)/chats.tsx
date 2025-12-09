import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { chats } from "@/data/data";
import { useRouter } from "expo-router";
import React from "react";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const images = [
  require("@/assets/images/common/profile_1_preview.png"),
  require("@/assets/images/common/profile_avatar.png"),
  require("@/assets/images/common/profile_2_preview.png"),
  require("@/assets/images/common/onboarding_1_preview.png"),
  require("@/assets/images/common/profile_3_preview.png"),
  require("@/assets/images/common/onboarding_2_preview.png"),
  require("@/assets/images/common/profile_4_preview.png"),
  require("@/assets/images/common/onboarding_3_preview.png"),
  require("@/assets/images/common/profile_5_preview.png"),
];

function Header() {
  return (
    <Box className="w-full flex flex-row items-center p-4 gap-2 justify-between mb-1">
      <Text size="2xl" className="font-satoshi font-medium">
        Chats
      </Text>
      <Button
        className="p-0 h-10 w-10 rounded-full bg-background-50 data-[active=true]:bg-background-100"
        variant="link"
      >
        <ButtonIcon as={SearchIcon} className="w-[18px] h-[18px] text-white" />
      </Button>
    </Box>
  );
}

function ChatProfiles() {
  const router = useRouter();
  return (
    <Box className="flex flex-col gap-3">
      <Text className="font-roboto px-4">Online Now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Box className="flex flex-row gap-3 mx-4">
          {chats.map(
            (chat) =>
              chat.online && (
                <AnimatedPressable
                  entering={FadeInRight.delay(chat.id * 100)}
                  className="bg-background-50 rounded-lg p-1.5 items-center gap-2.5 w-[84px] h-[84px] data-[active=true]:bg-background-100"
                  key={chat.id}
                  onPress={() => {
                    router.push(`/messages/${chat.id}`);
                  }}
                >
                  <Box className="relative">
                    <Image
                      source={images[chat.id % images.length]}
                      className="h-12 w-12 rounded-full overflow-hidden"
                      alt={chat.name}
                    />
                    <Box className="absolute bottom-0 right-0 bg-green-500 rounded-full w-2.5 h-2.5" />
                  </Box>
                  <Text size="xs" className="font-roboto text-center">
                    {chat.name.split(" ")[0] + ", " + chat.age}
                  </Text>
                </AnimatedPressable>
              )
          )}
        </Box>
      </ScrollView>
    </Box>
  );
}

function Chats() {
  const router = useRouter();
  return (
    <Box className="flex flex-col gap-[18px] mt-2 p-4 pb-0 flex-1">
      <Text className="font-roboto">Recent Chats</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box className="flex flex-col gap-2 mb-2">
          {chats.map((chat) => (
            <AnimatedPressable
              entering={FadeInDown.delay((chat.id + 5) * 100)}
              className="bg-background-50 rounded-lg p-4 gap-3 items-center flex-row justify-between w-full h-[84px] data-[active=true]:bg-background-100"
              key={chat.id}
              onPress={() => {
                router.push(`/messages/${chat.id}`);
              }}
            >
              <Box className="flex flex-row items-center gap-3 flex-1">
                <Image
                  source={images[chat.id % images.length]}
                  className="h-12 w-12 rounded-full overflow-hidden"
                  alt={chat.name}
                />
                <Box className="flex flex-col gap-1 flex-1">
                  <Text
                    className="font-roboto font-bold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {chat.name.split(" ")[0] + ", " + chat.age}
                  </Text>
                  <Text size="sm" className="font-roboto" numberOfLines={1}>
                    {chat.chats_history[0].message}
                  </Text>
                </Box>
              </Box>
              <Box className="flex flex-col-reverse items-end h-full justify-between">
                <Text
                  size="xs"
                  className="font-roboto text-xs text-typography-400"
                >
                  5 mins
                </Text>
                {chat.unread_messages > 0 && (
                  <Text
                    size="xs"
                    className="font-roboto text-[10px] p-1 px-2 rounded-md bg-primary-500"
                  >
                    {chat.unread_messages}
                  </Text>
                )}
              </Box>
            </AnimatedPressable>
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}

export default function Index() {
  return (
    <Box className="flex-1 bg-background-0">
      <Header />
      <ChatProfiles />
      <Chats />
    </Box>
  );
}
