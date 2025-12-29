import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneInput } from "@/components/shared/phone-input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";
import { sendOTP } from "@/services/auth";
import { Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { analytics } from "@/services/analytics";

const INSTRUCTIONS_TEXT = [
  { loginInstruction: "Please enter your mobile number" },
  {
    loginSubInstruction:
      "We'll send you a verification code to confirm your number",
  },
];

export default function Index() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Track login screen view
    analytics.trackScreen("login_screen");

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
  };

  const handlePhoneChange = (phone: string) => {
    setPhoneNumber(phone);
  };

  const handleSendOTP = async () => {
    if (!isValid || !phoneNumber) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    try {
      console.log("📱 Processing phone number:", phoneNumber);

      // Format phone number
      const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/^91/, '');

      console.log("📝 Formatted phone:", formattedPhone);

      // Track OTP request
      analytics.track("otp_requested", {
        phone_number_length: formattedPhone.length,
        has_country_code: phoneNumber.includes("+"),
      });

      // Store phone number in AsyncStorage
      await AsyncStorage.setItem('@dular:phone_number', formattedPhone);
      console.log("✅ Phone number stored in AsyncStorage");

      // Navigate to OTP screen with phone number as parameter
      console.log("🔄 Navigating to OTP screen with phone:", formattedPhone);
      router.push({
        pathname: "/onboarding/otp",
        params: { phoneNumber: formattedPhone }
      });
    } catch (error: any) {
      console.error("❌ Error processing phone number:", error);

      // Track error
      analytics.track("otp_request_failed", {
        error_message: error.message,
      });

      Alert.alert("Error", "Failed to process phone number. Please try again.");
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background-0"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + 80, 100),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Box className="flex-1 justify-start items-center gap-12 px-5 pt-20">
          <Box className="flex justify-start gap-3">
            <Text className="font-roboto text-2xl font-semibold leading-7">
              {INSTRUCTIONS_TEXT[0].loginInstruction}
            </Text>
            <Text className="font-roboto text-typography-500 leading-6">
              {INSTRUCTIONS_TEXT[1].loginSubInstruction}
            </Text>
          </Box>
          <PhoneInput
            onPhoneChange={handlePhoneChange}
            onValidationChange={handleValidationChange}
          />
        </Box>
        </ScrollView>
        <Fab
        size="lg"
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{
          marginBottom: keyboardHeight > 0
            ? keyboardHeight + 10
            : Math.max(insets.bottom, 20)
        }}
        isDisabled={!isValid}
        onPress={handleSendOTP}
      >
        <FabIcon as={ChevronRightIcon} />
        </Fab>
      </KeyboardAvoidingView>
  );
}
