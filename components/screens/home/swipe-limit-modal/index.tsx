/**
 * Swipe Limit Modal
 *
 * Displayed when user reaches their daily swipe limit.
 * Shows current plan, swipes used, and upgrade options.
 */

import React from "react";
import { Modal } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface SwipeLimitModalProps {
  visible: boolean;
  swipesUsed: number;
  swipesLimit: number;
  isPremium: boolean;
  planName: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export const SwipeLimitModal: React.FC<SwipeLimitModalProps> = ({
  visible,
  swipesUsed,
  swipesLimit,
  isPremium,
  planName,
  onClose,
  onUpgrade,
}) => {
  const handleUpgradePress = () => {
    onClose();
    // Navigate to subscription plans page
    router.push("/(protected)/subscription");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box className="flex-1 bg-black/80 justify-center items-center px-6">
        <AnimatedBox
          className="w-full max-w-md bg-background-0 rounded-3xl overflow-hidden"
          entering={SlideInDown.duration(400).springify()}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={["#FF6B9D", "#C239B3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 32 }}
          >
            <VStack className="items-center gap-4">
              <Box className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-6xl">⏱️</Text>
              </Box>
              <Heading size="2xl" className="text-white text-center font-satoshi">
                Daily Limit Reached
              </Heading>
              <Text className="text-white/90 text-center text-base leading-6">
                {isPremium
                  ? `You've used all ${swipesLimit} swipes for today on your ${planName} plan. Come back tomorrow!`
                  : `You've used all ${swipesLimit} free swipes for today. Upgrade to get more swipes!`}
              </Text>
            </VStack>
          </LinearGradient>

          {/* Content */}
          <VStack className="p-6 gap-6">
            {/* Swipe Counter */}
            <Box className="bg-background-50 rounded-2xl p-4">
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <Text className="text-typography-500 text-sm font-roboto">
                    Swipes Used Today
                  </Text>
                  <Heading size="xl" className="text-typography-950 font-satoshi mt-1">
                    {swipesUsed} / {swipesLimit}
                  </Heading>
                </VStack>
                <Box className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="text-primary-600 text-2xl font-bold">
                    {Math.round((swipesUsed / swipesLimit) * 100)}%
                  </Text>
                </Box>
              </HStack>

              {/* Progress Bar */}
              <Box className="h-2 bg-background-200 rounded-full mt-4 overflow-hidden">
                <Box
                  className="h-full bg-primary-500 rounded-full"
                  style={{
                    width: `${(swipesUsed / swipesLimit) * 100}%`,
                  }}
                />
              </Box>
            </Box>

            {/* Current Plan Badge */}
            <Box className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
              <HStack className="items-center gap-3">
                <Box className="bg-primary-500 p-2 rounded-full">
                  <Text className="text-white text-lg">
                    {isPremium ? "👑" : "🆓"}
                  </Text>
                </Box>
                <VStack className="flex-1">
                  <Text className="text-typography-900 text-sm font-semibold font-roboto">
                    Current Plan
                  </Text>
                  <Text className="text-typography-600 text-base font-roboto">
                    {planName}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Benefits of Upgrading (only show for free users) */}
            {!isPremium && (
              <VStack className="gap-3">
                <Text className="text-typography-900 text-sm font-semibold font-roboto">
                  Get Premium to unlock:
                </Text>
                {[
                  { icon: "✨", text: "More daily swipes" },
                  { icon: "💝", text: "See who likes you" },
                  { icon: "🚀", text: "Boost your profile" },
                  { icon: "⚡", text: "Priority matching" },
                ].map((benefit, index) => (
                  <HStack key={index} className="items-center gap-3">
                    <Box className="w-8 h-8 rounded-full bg-background-100 items-center justify-center">
                      <Text className="text-lg">{benefit.icon}</Text>
                    </Box>
                    <Text className="text-typography-600 text-sm font-roboto">
                      {benefit.text}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}

            {/* Action Buttons */}
            <VStack className="gap-3 mt-2">
              {!isPremium && (
                <Button
                  className="bg-primary-500 data-[active=true]:bg-primary-600"
                  size="lg"
                  onPress={handleUpgradePress}
                >
                  <ButtonText className="font-semibold font-roboto">
                    Upgrade Now
                  </ButtonText>
                </Button>
              )}

              <Button
                className="bg-background-100 data-[active=true]:bg-background-200"
                size="lg"
                onPress={onClose}
              >
                <ButtonText className="text-typography-900 font-semibold font-roboto">
                  {isPremium ? "Got It" : "Maybe Later"}
                </ButtonText>
              </Button>
            </VStack>

            {/* Reset Time Info */}
            <Text className="text-typography-500 text-xs text-center font-roboto">
              Your swipe limit will reset at midnight
            </Text>
          </VStack>
        </AnimatedBox>
      </Box>
    </Modal>
  );
};
