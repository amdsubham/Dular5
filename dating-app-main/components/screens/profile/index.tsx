import React from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ThreeDotsIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { ScrollView } from "@/components/ui/scroll-view";
import { Badge } from "@/components/ui/badge";
import { ImageBackground } from "@/components/ui/image-background";
import { LinearGradient } from "expo-linear-gradient";
import { LocationBadge, LoveBadge } from "../../shared/badge";
import { Text } from "@/components/ui/text";
import { QACard } from "./qa-card";
import { InstaCard } from "../../shared/instagram-card";
import { users } from "@/data/data";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";
const AnimatedBox = Animated.createAnimatedComponent(Box);

export const ProfileScreen = ({ user }: { user: number }) => {
  const userData = users[user];
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <AnimatedBox
        key={user}
        className="flex-1 gap-5 w-full p-4 pt-0 bg-background-0"
        entering={SlideInRight}
        exiting={SlideOutRight}
      >
        <HStack className="w-full items-center justify-between gap-3">
          <Heading size="3xl" className="font-roboto">
            {userData.name}, {userData.age}
          </Heading>
          {userData.isActive && (
            <Badge
              variant="outline"
              className="bg-transparent gap-1 rounded-full border-secondary-700 ml-auto"
            >
              <Box className="w-2 h-2 bg-secondary-700 rounded-full" />
              <Text className="text-secondary-700 pb-[3px]">active now</Text>
            </Badge>
          )}
          <Button variant="link" className="bg-transparent">
            <ButtonIcon
              as={ThreeDotsIcon}
              className="text-typography-950 data-[active=true]:text-typography-900"
            />
          </Button>
        </HStack>
        <ImageBackground
          source={userData.images[0]}
          className="w-full rounded-lg aspect-[0.8] justify-end overflow-hidden"
        >
          <LinearGradient
            colors={["#12121200", "#121212bb"]}
            className="flex-row w-full justify-between p-4"
          >
            <LoveBadge lovePercentage={userData.lovePercentage} size="lg" />
            <LocationBadge distance={userData.distance} size="lg" />
          </LinearGradient>
        </ImageBackground>
        <Box>
          <ScrollView
            horizontal
            className="w-full"
            showsHorizontalScrollIndicator={false}
          >
            <HStack className="gap-x-3">
              {userData.interests.map((item, index) => (
                <Text
                  key={index}
                  size="sm"
                  className="font-roboto bg-background-200 py-2 px-4 rounded-3xl items-center justify-center h-9"
                >
                  {item}
                </Text>
              ))}
            </HStack>
          </ScrollView>
        </Box>
        <Text size="sm">{userData.bio}</Text>
        <ImageBackground
          source={userData.images[1]}
          className="w-full rounded-lg aspect-square overflow-hidden"
        />
        <QACard
          question={userData.qa[0].question}
          answer={userData.qa[0].answer}
        />
        <ImageBackground
          source={userData.images[2]}
          className="w-full rounded-lg aspect-square overflow-hidden"
        />
        <ImageBackground
          source={userData.images[3]}
          className="w-full rounded-lg aspect-square overflow-hidden"
        />
        <QACard
          question={userData.qa[1].question}
          answer={userData.qa[1].answer}
        />
        <ImageBackground
          source={userData.images[4]}
          className="w-full rounded-lg aspect-square overflow-hidden"
        />
        {userData.qa.length > 2 && (
          <QACard
            question={userData.qa[2].question}
            answer={userData.qa[2].answer}
          />
        )}
        <InstaCard img={userData.images} />
      </AnimatedBox>
    </ScrollView>
  );
};
