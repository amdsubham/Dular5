import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { LogoIcon, BoltIcon, HelpCenterIcon } from "@/components/shared/icons";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import {
  ChevronRightIcon,
  EditIcon,
  Icon,
  SettingsIcon,
} from "@/components/ui/icon";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { profile } from "@/data/data";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

function Header() {
  return (
    <Box className="w-full flex flex-row items-center p-4 gap-2">
      <Icon as={LogoIcon} className="w-7 h-7" />
      <Heading size="xl" className="font-satoshi">
        Bloom
      </Heading>
    </Box>
  );
}

function ProfileHeader() {
  const router = useRouter();
  return (
    <Box className="items-center flex-row justify-between">
      <Heading size="2xl" className="font-roboto text-[32px]">
        {profile.name.split(" ")[0]}, {profile.age}
      </Heading>
      <Button
        className="bg-background-200 data-[active=true]:bg-background-300"
        size="sm"
        onPress={() => {
          router.push("/edit-profile");
        }}
      >
        <ButtonText className="text-typography-950 font-roboto data-[active=true]:text-typography-900">
          Edit Profile
        </ButtonText>
        <ButtonIcon
          as={EditIcon}
          className="text-typography-950 font-roboto data-[active=true]:text-typography-900"
        />
      </Button>
    </Box>
  );
}

function ProfileProgress() {
  const [number, setNumber] = useState(0);
  const targetNumber = 67;
  useEffect(() => {
    // If we haven't reached target yet
    if (number < targetNumber) {
      setTimeout(() => {
        setNumber((prev: any) => Math.min(prev + 2, targetNumber));
      }, 1); // Update every 1ms
    }
  }, [number]);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${number}%`,
    };
  });
  return (
    <Box className="h-[176px] flex flex-col items-center justify-center bg-background-50 rounded-lg mt-6 gap-5 p-3">
      <Box className="flex-row gap-x-5 w-full">
        <Image
          source={require(`@/assets/images/common/profile_avatar.png`)}
          className="aspect-square w-24 rounded-full"
          alt="profile"
        />
        <Box className="flex-col flex-1">
          <Box className="flex-row gap-x-2 items-center">
            <Text className="font-roboto text-secondary-500 flex-wrap text-sm font-semibold">
              {number}%
            </Text>
            <Box className="flex-1 flex-row h-1 bg-background-300 rounded-full">
              <Animated.View
                style={animatedStyle}
                className="bg-secondary-500 h-full rounded-full"
              />
            </Box>
          </Box>
          <Text className="font-roboto text-typography-500 flex-wrap text-sm">
            {profile.bio}
          </Text>
        </Box>
      </Box>
      <Button
        size="sm"
        className="bg-background-950 data-[active=true]:bg-background-800 self-end"
      >
        <ButtonText className="text-typography-0 font-roboto data-[active=true]:text-typography-50">
          Add More Details
        </ButtonText>
      </Button>
    </Box>
  );
}

function ProfileOptions() {
  return (
    <Box className="flex-col gap-y-2 mt-4 py-2">
      <Box className="flex-row gap-3 bg-primary-800 rounded-lg p-2 ">
        <Box className="bg-background-50 p-2.5 rounded-lg h-10 w-10 flex items-center justify-center">
          <Icon as={BoltIcon} className="w-5 h-5" />
        </Box>
        <Box className="flex-col flex-1">
          <Text className="font-roboto text-typography-950 font-medium">
            Profile Boost
          </Text>
          <Text className="font-roboto text-typography-800 text-sm">
            Get more visibility and increase your chances of finding the perfect
            match with our Profile Boost feature.
          </Text>
        </Box>
        <Pressable className="p-1">
          <Icon as={ChevronRightIcon} className="w-4 h-4" />
        </Pressable>
      </Box>
      <Pressable className="flex-row gap-x-2 items-center w-full gap-3 data-[active=true]:bg-background-50/50 rounded-lg py-3 mt-2 px-2">
        <Box className="bg-background-50 rounded-lg h-8 w-8 flex items-center justify-center">
          <Icon as={SettingsIcon} className="w-4 h-4" />
        </Box>
        <Text className="font-roboto text-typography-950 font-medium flex-1">
          Settings
        </Text>
        <Icon as={ChevronRightIcon} className="w-4 h-4" />
      </Pressable>
      <Pressable className="flex-row gap-x-2 items-center w-full gap-3 data-[active=true]:bg-background-50/50 rounded-lg py-3 px-2">
        <Box className="bg-background-50 rounded-lg h-8 w-8 flex items-center justify-center">
          <Icon as={HelpCenterIcon} className="w-4 h-4" />
        </Box>
        <Text className="font-roboto text-typography-950 font-medium flex-1">
          Help Center
        </Text>
        <Icon as={ChevronRightIcon} className="w-4 h-4" />
      </Pressable>
    </Box>
  );
}

export default function Index() {
  return (
    <>
      <Header />
      <Box className="px-4">
        <ProfileHeader />
        <ProfileProgress />
        <ProfileOptions />
      </Box>
    </>
  );
}
