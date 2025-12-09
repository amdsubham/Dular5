import React, { useState, useEffect } from "react";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ThreeDotsIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { ScrollView } from "@/components/ui/scroll-view";
import { Badge } from "@/components/ui/badge";
import { ImageBackground } from "@/components/ui/image-background";
import { Image } from "@/components/ui/image";
import { LinearGradient } from "expo-linear-gradient";
import { LocationBadge, LoveBadge } from "../../shared/badge";
import { Text } from "@/components/ui/text";
import { getUserProfile, calculateAge } from "@/services/profile";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";
import { ActivityIndicator } from "react-native";

const AnimatedBox = Animated.createAnimatedComponent(Box);

export const ProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoadStart = (imageUrl: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleImageLoadEnd = (imageUrl: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUrl]: false }));
  };

  if (loading) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-typography-500">Loading profile...</Text>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text className="text-typography-500">No profile data found</Text>
      </Box>
    );
  }

  const fullName = `${profile.firstName || ""} ${
    profile.lastName || ""
  }`.trim();
  const age = profile.dob ? calculateAge(profile.dob) : null;
  const displayName = age ? `${fullName}, ${age}` : fullName || "Profile";
  const pictures = profile.pictures || [];
  const interests = profile.interests || [];

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <AnimatedBox
        className="flex-1 gap-5 w-full p-4 pt-0 bg-background-0"
        entering={SlideInRight}
        exiting={SlideOutRight}
      >
        <HStack className="w-full items-center justify-between gap-3">
          <Heading size="3xl" className="font-roboto">
            {displayName}
          </Heading>
          <Button variant="link" className="bg-transparent">
            <ButtonIcon
              as={ThreeDotsIcon}
              className="text-typography-950 data-[active=true]:text-typography-900"
            />
          </Button>
        </HStack>

        {/* Main Profile Image */}
        {pictures.length > 0 && (
          <Box className="w-full rounded-lg aspect-[0.8] overflow-hidden relative">
            {imageLoading[pictures[0]] && (
              <Box className="absolute inset-0 items-center justify-center bg-background-900/50 rounded-lg z-10">
                <ActivityIndicator size="large" color="#fff" />
              </Box>
            )}
            <ImageBackground
              source={{ uri: pictures[0] }}
              className="w-full h-full justify-end"
              onLoadStart={() => handleImageLoadStart(pictures[0])}
              onLoadEnd={() => handleImageLoadEnd(pictures[0])}
              onError={() => handleImageLoadEnd(pictures[0])}
            >
              <LinearGradient
                colors={["#12121200", "#121212bb"]}
                className="flex-row w-full justify-between p-4"
              >
                <LoveBadge lovePercentage={80} size="lg" />
                <LocationBadge distance={10} size="lg" />
              </LinearGradient>
            </ImageBackground>
          </Box>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <Box>
            <ScrollView
              horizontal
              className="w-full"
              showsHorizontalScrollIndicator={false}
            >
              <HStack className="gap-x-3">
                {interests.map((item: string, index: number) => (
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
        )}

        {/* Additional Photos */}
        {pictures.slice(1, 5).map((imageUrl: string, index: number) => (
          <Box
            key={index}
            className="w-full rounded-lg aspect-square overflow-hidden relative"
          >
            {imageLoading[imageUrl] && (
              <Box className="absolute inset-0 items-center justify-center bg-background-900/50 rounded-lg z-10">
                <ActivityIndicator size="large" color="#fff" />
              </Box>
            )}
            <ImageBackground
              source={{ uri: imageUrl }}
              className="w-full h-full"
              onLoadStart={() => handleImageLoadStart(imageUrl)}
              onLoadEnd={() => handleImageLoadEnd(imageUrl)}
              onError={() => handleImageLoadEnd(imageUrl)}
            />
          </Box>
        ))}

        {/* Profile Information Card */}
        <Box className="w-full bg-background-50 rounded-2xl p-5 gap-y-3">
          <Box className="gap-y-2">
            {interests.length > 0 && (
              <Box className="mt-2">
                <Text className="font-roboto text-typography-600 text-xs font-medium mb-2">
                  Interests:
                </Text>
                <Box className="flex-row flex-wrap gap-2">
                  {interests.map((item: string, index: number) => (
                    <Text
                      key={index}
                      size="xs"
                      className="font-roboto bg-primary-50 text-primary-700 py-1.5 px-3 rounded-full"
                    >
                      {item}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </AnimatedBox>
    </ScrollView>
  );
};
