import React from "react";
import { Modal } from "react-native";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, ZoomIn, BounceIn } from "react-native-reanimated";
import { router } from "expo-router";

const AnimatedBox = Animated.createAnimatedComponent(Box);

export interface MatchData {
  matchId: string;
  matchedUser: {
    uid: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
  currentUser: {
    uid: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
}

interface MatchModalProps {
  visible: boolean;
  matchData: MatchData | null;
  onClose: () => void;
}

export const MatchModal = ({ visible, matchData, onClose }: MatchModalProps) => {
  if (!matchData) return null;

  const handleSendMessage = () => {
    onClose();
    // Navigate to chat screen
    router.push({
      pathname: "/(protected)/chat/[id]" as any,
      params: {
        id: matchData.matchId,
        userId: matchData.matchedUser.uid,
        userName: `${matchData.matchedUser.firstName} ${matchData.matchedUser.lastName}`,
      },
    });
  };

  const handleViewProfile = () => {
    onClose();
    // Navigate to user profile
    router.push({
      pathname: "/(protected)/user-profile/[id]" as any,
      params: { id: matchData.matchedUser.uid },
    });
  };

  const currentUserName = `${matchData.currentUser.firstName} ${matchData.currentUser.lastName}`.trim();
  const matchedUserName = `${matchData.matchedUser.firstName} ${matchData.matchedUser.lastName}`.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={["#FF006E", "#8338EC"]}
        className="flex-1 justify-center items-center"
      >
        <AnimatedBox
          entering={FadeIn.duration(400)}
          className="flex-1 justify-center items-center p-6 w-full"
        >
          {/* "It's a Match!" heading */}
          <AnimatedBox entering={BounceIn.duration(600).delay(200)}>
            <Heading
              size="4xl"
              className="text-white font-satoshi font-bold text-center mb-8"
            >
              It's a Match!
            </Heading>
          </AnimatedBox>

          {/* Profile Images */}
          <AnimatedBox
            entering={ZoomIn.duration(500).delay(400)}
            className="flex-row items-center justify-center mb-8"
          >
            {/* Current User Image */}
            <Box className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {matchData.currentUser.profileImage ? (
                <Image
                  source={{ uri: matchData.currentUser.profileImage }}
                  className="w-full h-full"
                  alt={currentUserName}
                />
              ) : (
                <Box className="w-full h-full bg-background-200 items-center justify-center">
                  <Text className="text-4xl">
                    {matchData.currentUser.firstName?.charAt(0) || "U"}
                  </Text>
                </Box>
              )}
            </Box>

            {/* Overlap Effect */}
            <Box className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg -ml-16">
              {matchData.matchedUser.profileImage ? (
                <Image
                  source={{ uri: matchData.matchedUser.profileImage }}
                  className="w-full h-full"
                  alt={matchedUserName}
                />
              ) : (
                <Box className="w-full h-full bg-background-200 items-center justify-center">
                  <Text className="text-4xl">
                    {matchData.matchedUser.firstName?.charAt(0) || "U"}
                  </Text>
                </Box>
              )}
            </Box>
          </AnimatedBox>

          {/* Names */}
          <AnimatedBox
            entering={FadeIn.duration(400).delay(600)}
            className="mb-10"
          >
            <Text className="text-white text-center text-lg font-roboto">
              You and <Text className="font-bold">{matchedUserName}</Text> have
              liked each other!
            </Text>
          </AnimatedBox>

          {/* Action Buttons */}
          <AnimatedBox
            entering={FadeIn.duration(400).delay(800)}
            className="w-full px-4 gap-3"
          >
            <Button
              size="lg"
              className="bg-white rounded-full"
              onPress={handleSendMessage}
            >
              <ButtonText className="text-primary-500 font-roboto font-semibold text-base">
                Send Message
              </ButtonText>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white rounded-full bg-transparent"
              onPress={handleViewProfile}
            >
              <ButtonText className="text-white font-roboto font-semibold text-base">
                View Profile
              </ButtonText>
            </Button>

            <Button
              size="lg"
              variant="link"
              className="bg-transparent"
              onPress={onClose}
            >
              <ButtonText className="text-white font-roboto text-base">
                Keep Swiping
              </ButtonText>
            </Button>
          </AnimatedBox>
        </AnimatedBox>
      </LinearGradient>
    </Modal>
  );
};
