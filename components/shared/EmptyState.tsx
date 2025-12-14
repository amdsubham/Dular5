/**
 * Empty State Component
 *
 * Beautiful, reusable empty state for different screens
 */

import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, BounceIn } from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface EmptyStateProps {
  icon: string; // Emoji icon
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradientColors?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  gradientColors = ["#FF6B9D", "#C239B3"],
}) => {
  return (
    <AnimatedBox
      entering={FadeInDown.duration(500).springify()}
      className="flex-1 items-center justify-center p-8"
    >
      <VStack className="items-center gap-6 max-w-[320px]">
        {/* Icon with gradient background */}
        <Animated.View entering={BounceIn.delay(200).springify()}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-6xl">{icon}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Heading size="2xl" className="text-center font-satoshi font-bold text-typography-950">
          {title}
        </Heading>

        {/* Description */}
        <Text className="text-center text-typography-600 font-roboto text-base leading-relaxed">
          {description}
        </Text>

        {/* Action Button */}
        {actionLabel && onAction && (
          <Button
            className="bg-primary-500 data-[active=true]:bg-primary-600 mt-2 px-8"
            size="lg"
            onPress={onAction}
          >
            <ButtonText className="font-semibold font-roboto">
              {actionLabel}
            </ButtonText>
          </Button>
        )}
      </VStack>
    </AnimatedBox>
  );
};
