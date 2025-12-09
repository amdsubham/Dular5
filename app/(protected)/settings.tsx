import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { ChevronLeftIcon, Icon, TrashIcon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import { ScrollView } from "@/components/ui/scroll-view";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Alert, ActivityIndicator } from "react-native";
import { updateUserDeleteRequest } from "@/services/profile";

const Header = () => {
  const router = useRouter();

  return (
    <Box className="w-full flex flex-row items-center py-3 gap-2 px-4">
      <Button variant="link" className="px-0" onPress={() => router.back()}>
        <ButtonIcon
          as={ChevronLeftIcon}
          className="text-typography-950 h-6 w-6"
        />
      </Button>
      <Heading size="lg" className="font-satoshi font-medium">
        Settings
      </Heading>
    </Box>
  );
};

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action will mark your account for deletion and our team will review your request.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await updateUserDeleteRequest(true);
              Alert.alert(
                "Request Submitted",
                "Your account deletion request has been submitted successfully. Your account will be reviewed and deleted within 48 hours. You can uninstall the app.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              console.error("Error requesting account deletion:", error);
              Alert.alert(
                "Error",
                "Failed to submit deletion request. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Box className="flex-1 bg-background-0">
      <Header />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <VStack className="gap-4 pb-8 mt-4">
          {/* Account Section */}
          <Box className="gap-2">
            <Text className="text-typography-600 text-xs font-roboto font-medium mb-2 px-2">
              ACCOUNT
            </Text>

            {/* Delete Account Option */}
            <Pressable
              className="flex-row gap-x-3 items-center w-full bg-background-50 rounded-lg py-4 px-4 data-[active=true]:bg-background-100"
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Box className="bg-error-50 rounded-lg h-10 w-10 flex items-center justify-center">
                <Icon as={TrashIcon} className="w-5 h-5 text-error-600" />
              </Box>
              <Box className="flex-1">
                <Text className="font-roboto text-typography-950 font-medium text-base">
                  Delete Account
                </Text>
                <Text className="font-roboto text-typography-600 text-xs mt-1">
                  Request permanent account deletion
                </Text>
              </Box>
              {loading && <ActivityIndicator size="small" />}
            </Pressable>
          </Box>

          {/* Information Section */}
          <Box className="bg-background-50 rounded-2xl p-4 mt-4 gap-2">
            <Box className="flex-row items-start gap-2">
              <Icon as={Icon} className="w-4 h-4 text-typography-500 mt-0.5" />
              <Text className="flex-1 text-typography-600 text-sm font-roboto leading-5">
                When you request to delete your account, it will be marked for
                review. Your account will be reviewed and deleted within 48
                hours.
              </Text>
            </Box>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}
