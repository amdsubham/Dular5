/**
 * Payment Result Screen
 *
 * Handles deep link redirects from CCAvenue payment gateway
 * Shows payment success/failure status and redirects user appropriately
 */

import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { ActivityIndicator } from "react-native";

const AnimatedBox = Animated.createAnimatedComponent(Box);

export default function PaymentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const status = params.status as string;
  const orderId = params.orderId as string;
  const trackingId = params.trackingId as string;

  const isSuccess = status === "Success";

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (isSuccess) {
      // Navigate to home or profile
      router.replace("/(protected)/(root)/home");
    } else {
      // Go back to subscription page
      router.replace("/(protected)/subscription");
    }
  };

  if (loading) {
    return (
      <Box className="flex-1 bg-background-0 justify-center items-center">
        <ActivityIndicator size="large" color="#EC4899" />
        <Text className="text-typography-500 mt-4 font-roboto">
          Processing payment result...
        </Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-0">
      <LinearGradient
        colors={isSuccess ? ["#10B981", "#059669"] : ["#EF4444", "#DC2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Box className="flex-1 justify-center items-center p-6">
          <AnimatedBox
            className="bg-white rounded-3xl p-8 w-full max-w-md"
            entering={ZoomIn.duration(400).springify()}
          >
            <VStack className="items-center gap-6">
              {/* Icon */}
              <AnimatedBox
                className={`w-24 h-24 rounded-full justify-center items-center ${
                  isSuccess ? "bg-green-100" : "bg-red-100"
                }`}
                entering={FadeIn.delay(200).duration(400)}
              >
                <Text className="text-5xl">
                  {isSuccess ? "✅" : "❌"}
                </Text>
              </AnimatedBox>

              {/* Title */}
              <VStack className="items-center gap-2">
                <Heading size="2xl" className="text-typography-950 font-satoshi text-center">
                  {isSuccess ? "Payment Successful!" : "Payment Failed"}
                </Heading>
                <Text className="text-typography-600 text-center font-roboto text-sm">
                  {isSuccess
                    ? "Your subscription has been activated"
                    : "We couldn't process your payment"}
                </Text>
              </VStack>

              {/* Details */}
              <Box className="bg-background-50 rounded-xl p-4 w-full">
                <VStack className="gap-2">
                  <VStack className="gap-1">
                    <Text className="text-typography-500 text-xs font-roboto">
                      Order ID
                    </Text>
                    <Text className="text-typography-900 text-sm font-semibold font-roboto">
                      {orderId || "N/A"}
                    </Text>
                  </VStack>

                  {trackingId && (
                    <VStack className="gap-1">
                      <Text className="text-typography-500 text-xs font-roboto">
                        Tracking ID
                      </Text>
                      <Text className="text-typography-900 text-sm font-semibold font-roboto">
                        {trackingId}
                      </Text>
                    </VStack>
                  )}

                  <VStack className="gap-1">
                    <Text className="text-typography-500 text-xs font-roboto">
                      Status
                    </Text>
                    <Text
                      className={`text-sm font-semibold font-roboto ${
                        isSuccess ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {status}
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              {/* Additional Info */}
              {!isSuccess && (
                <Box className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 w-full">
                  <Text className="text-yellow-800 text-xs font-roboto text-center">
                    If money was deducted from your account, it will be refunded within 3-5 business days.
                  </Text>
                </Box>
              )}

              {/* Action Button */}
              <Button
                className="bg-primary-500 data-[active=true]:bg-primary-600 w-full"
                size="lg"
                onPress={handleContinue}
              >
                <ButtonText className="font-semibold font-roboto">
                  {isSuccess ? "Continue to App" : "Try Again"}
                </ButtonText>
              </Button>

              {/* Secondary Action */}
              {isSuccess && (
                <Button
                  className="bg-transparent"
                  size="sm"
                  onPress={() => router.replace("/(protected)/(root)/profile")}
                >
                  <ButtonText className="text-primary-500 font-roboto">
                    View Profile
                  </ButtonText>
                </Button>
              )}
            </VStack>
          </AnimatedBox>
        </Box>
      </LinearGradient>
    </Box>
  );
}
