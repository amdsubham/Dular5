import React from "react";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { AddIcon, Icon, InfoIcon, RemoveIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { PenIcon } from "@/components/shared/icons";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { users } from "@/data/data";
import Animated, { SlideInLeft, SlideOutLeft } from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const EditScreen = () => {
  const user = users[2];
  return (
    <AnimatedBox
      className="flex-1 gap-5 p-4 pt-0 w-full bg-background-0"
      entering={SlideInLeft}
      exiting={SlideOutLeft}
    >
      {/* My photos & videos */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium mb-1">
          My Photos & Videos
        </Text>
        <Box className="flex-wrap justify-between gap-y-2.5 flex-row">
          {[
            require("assets/images/common/profile_avatar.png"),
            require("@/assets/images/common/onboarding_1_preview.png"),
            require("@/assets/images/common/onboarding_2_preview.png"),
            require("@/assets/images/common/onboarding_3_preview.png"),
            false,
            false,
          ].map((image, index) => (
            <Box className="w-[31%] aspect-square" key={index}>
              {image ? (
                <>
                  <Image
                    source={image}
                    className="w-full h-full object-cover rounded-lg"
                    alt="instagram"
                  />
                  <Box className="absolute -top-3 right-2.5 bg-background-950 p-1 rounded-full">
                    <Icon
                      as={RemoveIcon}
                      className="text-typography-50 h-3 w-3"
                    />
                  </Box>
                  {image &&
                    (index === 0 ? (
                      <Box className="absolute bottom-2 left-2 bg-secondary-500/70 py-1 px-2 rounded-full">
                        <Text className="text-secondary-900 text-2xs">
                          Main
                        </Text>
                      </Box>
                    ) : (
                      <Box className="absolute bottom-2 left-2 bg-background-50 h-5 w-5 items-center justify-center rounded-full">
                        <Text className="text-typography-500 text-2xs">
                          {index + 1}
                        </Text>
                      </Box>
                    ))}
                </>
              ) : (
                <Box className="w-full h-full rounded-lg items-center justify-center border border-background-100">
                  <Icon as={AddIcon} size="lg" />
                </Box>
              )}
            </Box>
          ))}
        </Box>
        <HStack className="justify-center gap-2 items-center">
          <Icon as={InfoIcon} className="text-typography-500" />
          <Text className="text-typography-500 text-sm font-medium">
            Hold and draw photo/video to reorder
          </Text>
        </HStack>
      </Box>
      {/* Interests */}
      <Box className="gap-3">
        <HStack className="justify-between items-center">
          <Text className="text-typography-950 text-base font-medium mb-1">
            Interests ({user.interests.length}/10)
          </Text>
          <Button className="p-1.5 bg-background-100 data-[active=true]:bg-background-200 h-auto">
            <ButtonIcon
              as={PenIcon}
              className="text-typography-900 data-[active=true]:text-typography-950"
            />
          </Button>
        </HStack>
        <Box className="flex-wrap flex-row gap-2 p-4 border border-background-100 rounded-lg">
          {user.interests.map((interest) => (
            <Box
              className="bg-background-100 px-4 py-2 rounded-full"
              key={interest}
            >
              <Text className="text-typography-950 text-xs">{interest}</Text>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Profile Description */}
      <Box className="gap-3">
        <HStack className="justify-between items-center">
          <Text className="text-typography-950 text-base font-medium mb-1">
            Profile Description
          </Text>
          <Button className="p-1.5 bg-background-100 data-[active=true]:bg-background-200 h-auto">
            <ButtonIcon
              as={PenIcon}
              className="text-typography-900 data-[active=true]:text-typography-950"
            />
          </Button>
        </HStack>
        <Box className="flex-wrap flex-row gap-2 p-4 bg-background-50 rounded-lg">
          <Text className="text-typography-950 text-sm">{user.bio}</Text>
        </Box>
      </Box>
      {/* Prompts */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium mb-1">
          Prompts
        </Text>

        <Pressable className="flex-row gap-2 py-2.5 px-4 self-center mb-1">
          <Text className="text-typography-950 text-sm">Add New Prompt</Text>
          <Icon as={AddIcon} />
        </Pressable>

        {user.qa.map(({ question, answer }, index) => (
          <VStack
            className="gap-4 p-4 mb-1 bg-background-50 rounded-lg"
            key={index}
          >
            <HStack className="justify-between items-center">
              <Text className="text-typography-600 text-sm">{question}</Text>
              <Button className="p-1.5 bg-background-400 data-[active=true]:bg-background-500 h-auto">
                <ButtonIcon
                  as={PenIcon}
                  className="text-typography-900 data-[active=true]:text-typography-950"
                />
              </Button>
            </HStack>
            <Text className="text-typography-950">{answer}</Text>
          </VStack>
        ))}
      </Box>
      {/* Social Media */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium">
          Social Media
        </Text>
        {/* Instagram */}
        <Box className="flex-row gap-2 py-2.5 self-center mb-1 w-full items-center">
          <Image
            source={require("@/assets/images/profile/instagram.png")}
            className="h-6 w-6"
            alt="instagram"
          />
          <Text className="text-typography-600 mr-auto">Rob_98</Text>
          <Button className="p-1.5 bg-background-400 data-[active=true]:bg-background-500 h-auto">
            <ButtonIcon
              as={PenIcon}
              className="text-typography-900 data-[active=true]:text-typography-950"
            />
          </Button>
        </Box>
        <Box className="flex-wrap justify-between gap-y-2.5 flex-row">
          {[
            require("@/assets/images/common/profile_avatar.png"),
            require("@/assets/images/common/onboarding_1_preview.png"),
            require("@/assets/images/common/onboarding_2_preview.png"),
            require("@/assets/images/common/onboarding_3_preview.png"),
            require("@/assets/images/common/profile_avatar.png"),
            require("@/assets/images/common/onboarding_1_preview.png"),
          ].map((image, index) => (
            <Box className="w-[31%] aspect-square" key={index}>
              <Image
                source={image}
                className="w-full h-full object-cover rounded-lg"
                alt="instagram"
              />
              <Box className="absolute bottom-2 left-2 bg-background-900 h-5 w-5 items-center justify-center rounded-full">
                <Text className="text-typography-200 text-2xs">
                  {index + 1}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
        <HStack className="justify-center gap-2 items-center">
          <Icon as={InfoIcon} className="text-typography-500" />
          <Text className="text-typography-500 text-sm font-medium">
            Hold and draw photo/video to reorder
          </Text>
        </HStack>
        {/* Spotify */}
        <HStack className="gap-1.5 items-center">
          <Image
            source={require("@/assets/images/profile/spotify.png")}
            className="h-6 w-6"
            alt="spotify"
          />
          <Text className="text-typography-600 mr-auto">Spotify</Text>
        </HStack>
        <VStack className="gap-4 bg-background-50 py-3 px-4 rounded-md">
          <HStack className="gap-2 p-0 w-full">
            <Icon
              as={InfoIcon}
              className="text-typography-500 self-start h-5 w-5 p-0.5 mt-0.5"
              size="lg"
            />
            <Text className="text-typography-500 text-[16px] flex-1">
              Lorem ipsum dolor sit amet consectetur. Convallis convallis amet
              faucibus in.
            </Text>
          </HStack>
          <Button
            className="bg-background-900 data-[active=true]:bg-background-700 self-end"
            size="xs"
          >
            <ButtonText>Add Playlist</ButtonText>
          </Button>
        </VStack>
      </Box>
    </AnimatedBox>
  );
};
