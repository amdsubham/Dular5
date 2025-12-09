import React from "react";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { ChevronLeftIcon, Icon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import { ScrollView } from "@/components/ui/scroll-view";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Mail } from "lucide-react-native";

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
        Help Center
      </Heading>
    </Box>
  );
};

export default function HelpCenter() {
  return (
    <Box className="flex-1 bg-background-0">
      <Header />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <VStack className="gap-6 pb-8">
          {/* Contact Support Section */}
          <Box className="bg-background-50 rounded-2xl p-5 gap-4">
            <Box className="flex-row items-center gap-3">
              <Box className="bg-primary-100 rounded-full h-12 w-12 items-center justify-center">
                <Icon as={Mail} className="w-6 h-6 text-primary-700" />
              </Box>
              <Box className="flex-1">
                <Heading size="md" className="font-roboto font-semibold text-typography-950 mb-1">
                  Need Help?
                </Heading>
                <Text className="text-typography-600 text-sm">
                  We're here to assist you
                </Text>
              </Box>
            </Box>
            <Box className="gap-2">
              <Text className="text-typography-700 text-base font-roboto">
                If you have any questions, concerns, or need assistance, please feel free to reach out to us at:
              </Text>
              <Text className="text-primary-600 text-base font-roboto font-semibold">
                dularapp@gmail.com
              </Text>
              <Text className="text-typography-600 text-sm font-roboto mt-2">
                Our support team typically responds within 24-48 hours.
              </Text>
            </Box>
          </Box>

          {/* Terms and Conditions Section */}
          <Box className="gap-4">
            <Heading size="lg" className="font-roboto font-semibold text-typography-950">
              Terms and Conditions
            </Heading>

            {/* Introduction */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                1. Acceptance of Terms
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                By accessing and using Dular, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
              </Text>
            </Box>

            {/* Eligibility */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                2. Eligibility
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                You must be at least 18 years old to use Dular. By creating an account, you confirm that you meet this age requirement and that all information provided is accurate and truthful.
              </Text>
            </Box>

            {/* Account Responsibilities */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                3. Account Responsibilities
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </Text>
            </Box>

            {/* User Conduct */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                4. User Conduct
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                Users must treat others with respect. Harassment, hate speech, bullying, or any form of abusive behavior is strictly prohibited. Users must not impersonate others or create fake profiles.
              </Text>
            </Box>

            {/* Content Guidelines */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                5. Content Guidelines
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                You are solely responsible for the content you share on Dular. Prohibited content includes but is not limited to: explicit material, violence, illegal activities, spam, or content that infringes on others' intellectual property rights.
              </Text>
            </Box>

            {/* Privacy and Data */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                6. Privacy and Data Collection
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                We collect and process your personal information as described in our Privacy Policy. This includes your profile information, photos, interests, and usage data to provide better matches and improve your experience.
              </Text>
            </Box>

            {/* Safety */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                7. Safety and Security
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                While we strive to provide a safe platform, we cannot guarantee the conduct of other users. Always exercise caution when meeting someone in person, meet in public places, and inform friends or family of your plans.
              </Text>
            </Box>

            {/* Termination */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                8. Account Termination
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                We reserve the right to suspend or terminate accounts that violate these terms or engage in behavior that harms the community. You may also delete your account at any time through the app settings.
              </Text>
            </Box>

            {/* Disclaimer */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                9. Disclaimer of Warranties
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                Dular is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible for the accuracy of user profiles or content.
              </Text>
            </Box>

            {/* Limitation of Liability */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                10. Limitation of Liability
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                Dular shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to interactions with other users.
              </Text>
            </Box>

            {/* Changes to Terms */}
            <Box className="gap-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                11. Changes to Terms
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                We reserve the right to modify these Terms and Conditions at any time. Continued use of the app after changes constitutes acceptance of the new terms.
              </Text>
            </Box>

            {/* Contact */}
            <Box className="gap-2 mt-2">
              <Heading size="sm" className="font-roboto font-semibold text-typography-950">
                12. Contact Information
              </Heading>
              <Text className="text-typography-700 text-sm font-roboto leading-5">
                For questions about these Terms and Conditions, please contact us at dularapp@gmail.com
              </Text>
            </Box>

            {/* Last Updated */}
            <Box className="mt-4 pt-4 border-t border-background-200">
              <Text className="text-typography-500 text-xs font-roboto text-center">
                Last Updated: December 2025
              </Text>
            </Box>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}
