import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ImageBackground } from "@/components/ui/image-background";
import { Icon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { ScrollView } from "@/components/ui/scroll-view";
import { ArrowLeftIcon } from "@/components/ui/icon";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { calculateAge } from "@/services/profile";
import { LocationBadge, LoveBadge } from "@/components/shared/badge";
import { getCurrentUser } from "@/services/auth";
import { calculateDistance } from "@/services/location";

interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  pictures: string[];
  interests: string[];
  lookingFor: string[];
  distance: number;
  height?: string;
}

const UserProfileScreen = () => {
  const params = useLocalSearchParams();
  const userId = params.id as string;
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Get user document
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        console.error("User not found");
        return;
      }

      const userData = userDoc.data();
      const onboardingData = userData.onboarding?.data || {};

      // Get current user's location for distance calculation
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentUserData = currentUserDoc.data();
      const currentUserLocation = currentUserData?.location;

      let distance = 0;
      if (currentUserLocation && userData.location) {
        distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          userData.location.latitude,
          userData.location.longitude
        );
      }

      const age = calculateAge(onboardingData.dob);

      setProfile({
        firstName: onboardingData.firstName || "User",
        lastName: onboardingData.lastName || "",
        age,
        gender: onboardingData.gender || "",
        pictures: onboardingData.pictures || [],
        interests: onboardingData.interests || [],
        lookingFor: onboardingData.lookingFor || [],
        distance,
        height: onboardingData.height,
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    // Find the match/chat ID
    // For now, we'll construct it based on user IDs
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const matchId = `${currentUser.uid}_${userId}`;
    const reverseMatchId = `${userId}_${currentUser.uid}`;

    // Try both possible match IDs
    router.push({
      pathname: "/(protected)/chat/[id]" as any,
      params: {
        id: matchId,
        userId: userId,
        userName: profile ? `${profile.firstName} ${profile.lastName}` : "User",
      },
    });
  };

  if (loading) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-typography-500 mt-4 font-roboto">
          Loading profile...
        </Text>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box className="flex-1 bg-background-0 items-center justify-center p-8">
        <Text className="text-typography-500 text-center font-roboto">
          Profile not found
        </Text>
        <Button className="mt-4" onPress={() => router.back()}>
          <ButtonText>Go Back</ButtonText>
        </Button>
      </Box>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box
        className="absolute top-0 left-0 right-0 z-10 px-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-background-900/50 items-center justify-center"
        >
          <Icon as={ArrowLeftIcon} className="w-6 h-6 text-white" />
        </Pressable>
      </Box>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Main Profile Image */}
        {profile.pictures[0] ? (
          <ImageBackground
            source={{ uri: profile.pictures[0] }}
            className="w-full aspect-[0.8] justify-end"
          >
            <LinearGradient
              colors={["#12121200", "#121212bb"]}
              className="p-4"
            >
              <Heading size="3xl" className="text-white font-roboto mb-2">
                {displayName}, {profile.age}
              </Heading>
              <HStack className="gap-2">
                <LocationBadge distance={profile.distance} size="lg" />
              </HStack>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <Box className="w-full aspect-[0.8] bg-background-100 items-center justify-center">
            <Text className="text-6xl">{profile.firstName?.charAt(0) || "U"}</Text>
            <Heading size="xl" className="mt-4">
              {displayName}, {profile.age}
            </Heading>
          </Box>
        )}

        <Box className="p-4 gap-6">
          {/* About Section */}
          <VStack className="gap-2">
            <Heading size="lg" className="font-roboto font-semibold">
              About
            </Heading>
            <HStack className="flex-wrap gap-2">
              <Box className="bg-background-100 px-3 py-2 rounded-full">
                <Text className="font-roboto text-sm">{profile.gender}</Text>
              </Box>
              {profile.height && (
                <Box className="bg-background-100 px-3 py-2 rounded-full">
                  <Text className="font-roboto text-sm">{profile.height}</Text>
                </Box>
              )}
              <Box className="bg-background-100 px-3 py-2 rounded-full">
                <Text className="font-roboto text-sm">
                  {profile.distance} km away
                </Text>
              </Box>
            </HStack>
          </VStack>

          {/* Looking For */}
          {profile.lookingFor.length > 0 && (
            <VStack className="gap-2">
              <Heading size="lg" className="font-roboto font-semibold">
                Looking For
              </Heading>
              <HStack className="flex-wrap gap-2">
                {profile.lookingFor.map((item, index) => (
                  <Box
                    key={index}
                    className="bg-primary-50 px-3 py-2 rounded-full"
                  >
                    <Text className="font-roboto text-sm text-primary-600">
                      {item.replace("-", " ")}
                    </Text>
                  </Box>
                ))}
              </HStack>
            </VStack>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <VStack className="gap-2">
              <Heading size="lg" className="font-roboto font-semibold">
                Interests
              </Heading>
              <HStack className="flex-wrap gap-2">
                {profile.interests.map((item, index) => (
                  <Box
                    key={index}
                    className="bg-background-200 px-3 py-2 rounded-full"
                  >
                    <Text className="font-roboto text-sm">{item}</Text>
                  </Box>
                ))}
              </HStack>
            </VStack>
          )}

          {/* Additional Photos */}
          {profile.pictures.length > 1 && (
            <VStack className="gap-2">
              <Heading size="lg" className="font-roboto font-semibold">
                Photos
              </Heading>
              {profile.pictures.slice(1).map((imageUrl, index) => (
                <ImageBackground
                  key={index}
                  source={{ uri: imageUrl }}
                  className="w-full aspect-square rounded-lg overflow-hidden"
                />
              ))}
            </VStack>
          )}

          {/* Bottom Spacing */}
          <Box className="h-24" />
        </Box>
      </ScrollView>

      {/* Send Message Button */}
      <Box
        className="absolute bottom-0 left-0 right-0 p-4 bg-background-0 border-t border-background-100"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Button
          size="lg"
          className="bg-primary-500 rounded-full"
          onPress={handleSendMessage}
        >
          <ButtonText className="text-white font-roboto font-semibold">
            Send Message
          </ButtonText>
        </Button>
      </Box>
    </Box>
  );
};

export default UserProfileScreen;
