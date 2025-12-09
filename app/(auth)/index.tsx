import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneInput } from "@/components/shared/phone-input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";
import { sendOTP } from "@/services/auth";
import { Alert } from "react-native";
import { FirebaseRecaptcha } from "@/components/shared/firebase-recaptcha";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";

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
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

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

    if (!recaptchaVerifier.current) {
      Alert.alert("Error", "reCAPTCHA verifier not initialized");
      return;
    }

    console.log("Sending OTP to:", phoneNumber);
    console.log("reCAPTCHA verifier ref:", recaptchaVerifier.current);
    setLoading(true);
    
    try {
      // Ensure reCAPTCHA modal is ready
      console.log("Starting OTP send process...");
      
      const result = await sendOTP(phoneNumber, recaptchaVerifier.current);
      console.log("OTP Result:", result);
      
      if (result.success) {
        // Don't show alert, just navigate
        router.push("/onboarding/otp");
      } else {
        // Show detailed error message
        const errorMessage = result.error || "Failed to send OTP. Please try again.";
        console.error("OTP send failed:", errorMessage);
        Alert.alert(
          "Error", 
          errorMessage,
          [
            {
              text: "OK",
              style: "default"
            },
            // Add help button if billing error
            ...(errorMessage.includes('billing') ? [{
              text: "Learn More",
              onPress: () => {
                // You can add a link to Firebase docs here
                console.log("Visit: https://firebase.google.com/docs/auth/phone-auth");
              }
            }] : [])
          ]
        );
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      {/* <OnboardingHeader/> */}
      <Box className="flex-1 justify-start items-center gap-12 px-5 top-20">
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
      <Fab
        size="lg"
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
        isDisabled={!isValid || loading}
        onPress={handleSendOTP}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
      <FirebaseRecaptcha ref={recaptchaVerifier} attemptInvisibleVerification={false} />
    </Box>
  );
}
