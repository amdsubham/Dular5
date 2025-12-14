import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Alert, ActivityIndicator } from "react-native";
import { updateOnboardingProgress } from "@/services/onboarding";
import { requestLocationPermission, getCurrentLocation } from "@/services/location";
import { registerForPushNotifications, savePushTokenToFirestore } from "@/services/notifications";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import Animated, { FadeInDown } from "react-native-reanimated";

const AnimatedVStack = Animated.createAnimatedComponent(VStack);

const Location = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleAllowLocation = async () => {
    try {
      setLoading(true);

      // Request location permission
      const permissionGranted = await requestLocationPermission();

      if (!permissionGranted) {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to find matches near you. Please enable location access in your device settings.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // Get current location
      const location = await getCurrentLocation();

      if (location) {
        // Save location to onboarding data
        await updateOnboardingProgress("location", {
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Request notification permission right after location
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await savePushTokenToFirestore(pushToken);
          console.log("Push notifications enabled");
        } else {
          console.log("Push notifications permission denied or unavailable");
        }

        // Navigate to done screen
        router.push("/onboarding/done");
      } else {
        Alert.alert(
          "Location Error",
          "Unable to get your current location. Please check your device settings and try again."
        );
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Error",
        "Failed to get your location. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-0 justify-between">
      {/* Progress Bar */}
      <Box className="px-5 pt-11">
        <Progress
          value={(8 / 8) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>
      </Box>

      {/* Content */}
      <AnimatedVStack
        entering={FadeInDown.duration(400)}
        className="flex-1 justify-center items-center gap-8 px-5"
      >
        <Box className="w-[280px] h-[280px] bg-primary-50 rounded-full items-center justify-center">
          <Box className="w-32 h-32 bg-primary-100 rounded-full items-center justify-center">
            <Text className="text-6xl">📍</Text>
          </Box>
        </Box>

        <VStack className="gap-3 items-center">
          <Heading className="text-typography-950 text-3xl font-roboto font-semibold text-center">
            Enable Location
          </Heading>
          <Text className="text-typography-600 text-base font-roboto text-center px-4">
            We need your location to help you find matches nearby. Your exact location is kept private and secure.
          </Text>
        </VStack>
      </AnimatedVStack>

      {/* Buttons */}
      <Box className="px-5 pb-8" style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}>
        <Button
          size="lg"
          className="bg-primary-500 rounded-lg data-[active=true]:bg-primary-600"
          onPress={handleAllowLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ButtonText className="text-white font-roboto font-semibold text-base">
              Allow Location Access
            </ButtonText>
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default Location;
