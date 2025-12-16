import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { OTPComponent } from "@/components/shared/otp-input";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";
import { verifyOTP, sendOTP, getStoredPhoneNumber } from "@/services/auth";
import { Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { startSMSListener } from "@/services/sms-listener";

const INSTRUCTIONS_TEXT = [
  {
    otpInstruction: "Enter verification code",
    otpSubInstruction:
      "We have sent you a verification code to your mobile number",
  },
];

export default function Otp() {
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Keyboard listeners
  useEffect(() => {
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

  // Send OTP when screen loads
  useEffect(() => {
    const sendOTPOnLoad = async () => {
      try {
        setSendingOTP(true);

        console.log("🔍 ALL PARAMS:", JSON.stringify(params, null, 2));
        console.log("🔍 Params keys:", Object.keys(params));

        // Wait a bit for params to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        // Try to get phone number from route params first, then AsyncStorage
        let phoneNumber = params.phoneNumber as string;

        console.log("📱 Phone from params:", phoneNumber);
        console.log("📱 Phone from params (type):", typeof phoneNumber);
        console.log("📱 Phone from params (value):", JSON.stringify(phoneNumber));

        // If no phone in params, try AsyncStorage with retry
        if (!phoneNumber) {
          console.log("📱 No phone in params, checking AsyncStorage...");

          // Try multiple times with delay
          for (let i = 0; i < 3; i++) {
            const storedPhone = await getStoredPhoneNumber();
            console.log(`📱 Stored phone attempt ${i + 1}:`, storedPhone);

            if (storedPhone) {
              phoneNumber = storedPhone;
              break;
            }

            // Wait before retrying
            if (i < 2) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          console.log("📱 Phone from AsyncStorage:", phoneNumber);
        }

        // Ensure phoneNumber is a string and trim it
        phoneNumber = String(phoneNumber || '').trim();

        console.log("📱 Final phone number:", phoneNumber);
        console.log("📱 Final phone number length:", phoneNumber.length);

        if (!phoneNumber || phoneNumber.length === 0) {
          console.error("❌ No phone number found after all attempts");
          Alert.alert("Error", "Phone number not found. Please go back and enter your phone number.");
          router.back();
          return;
        }

        console.log("📱 Sending OTP to:", phoneNumber);
        const result = await sendOTP(phoneNumber, null);

        if (!result.success) {
          console.error("❌ Failed to send OTP:", result.error);
          Alert.alert("Error", result.error || "Failed to send OTP. Please try again.");
          router.back();
        } else {
          console.log("✅ OTP sent successfully");
        }
      } catch (error: any) {
        console.error("❌ Error sending OTP:", error);
        console.error("❌ Error stack:", error.stack);
        Alert.alert("Error", "Failed to send OTP. Please try again.");
        router.back();
      } finally {
        setSendingOTP(false);
      }
    };

    // Add a small delay before starting to allow params to settle
    const timeoutId = setTimeout(() => {
      sendOTPOnLoad();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-read OTP from SMS (Android only)
  useEffect(() => {
    console.log('🔔 Setting up SMS listener for auto-fill...');

    const cleanup = startSMSListener((otp) => {
      // Clean and limit OTP to 6 digits
      const cleanOtp = String(otp || '').trim().replace(/\D/g, '').slice(0, 6);
      console.log('✅ Auto-filled OTP (raw):', otp);
      console.log('✅ Auto-filled OTP (clean):', cleanOtp, 'length:', cleanOtp.length);

      if (cleanOtp.length === 6) {
        setOtpValue(cleanOtp);
        // Auto-verify after a short delay
        setTimeout(() => {
          handleVerifyOTP(cleanOtp);
        }, 500);
      }
    });

    return () => {
      console.log('🛑 Cleaning up SMS listener');
      cleanup();
    };
  }, []);

  const handleOtpChange = (otp: string) => {
    // Only take first 6 digits, remove non-digits, and ensure it's clean
    const cleanOtp = String(otp || '')
      .replace(/\D/g, '') // Remove all non-digit characters
      .slice(0, 6); // Take only first 6 digits
    console.log('🔄 OTP changed in parent (raw):', otp, 'length:', otp?.length);
    console.log('🔄 OTP changed in parent (clean):', cleanOtp, 'length:', cleanOtp.length);
    console.log('🔄 Setting OTP value to:', cleanOtp);
    setOtpValue(cleanOtp);
    console.log('🔄 OTP state updated, button should be:', cleanOtp.length === 6 ? 'ENABLED' : 'DISABLED');
  };

  const handleVerifyOTP = async (otp?: string) => {
    // Ensure we have a string value and clean it aggressively
    const rawOtp = otp || otpValue || '';
    const otpToVerify = String(rawOtp)
      .replace(/\D/g, '') // Remove all non-digits
      .slice(0, 6); // Take only first 6 digits

    console.log('🔐 Verifying OTP...');
    console.log('Raw OTP:', rawOtp, 'length:', rawOtp?.length);
    console.log('OTP value:', otpToVerify, 'length:', otpToVerify.length);
    console.log('OTP type:', typeof otpToVerify);

    if (!otpToVerify || otpToVerify.length !== 6) {
      console.error('❌ Invalid OTP length:', otpToVerify.length);
      console.error('❌ Raw OTP was:', JSON.stringify(rawOtp));
      Alert.alert("Error", `Please enter the complete verification code (entered: ${otpToVerify.length} digits)`);
      return;
    }

    // Check if OTP contains only digits (should always pass now due to replace above)
    if (!/^\d{6}$/.test(otpToVerify)) {
      console.error('❌ Invalid OTP format:', otpToVerify);
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      console.log('✅ Calling verifyOTP with:', otpToVerify);
      const result = await verifyOTP(otpToVerify);

      if (result.success) {
        console.log('✅ OTP verification successful');
        router.push("/onboarding/verified");
      } else {
        console.error('❌ OTP verification failed:', result.error);
        Alert.alert("Error", result.error || "Invalid verification code. Please try again.");
      }
    } catch (error: any) {
      console.error('❌ Error during verification:', error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
              {INSTRUCTIONS_TEXT[0].otpInstruction}
            </Text>
            <Text className="font-roboto text-typography-500 leading-6">
              {sendingOTP
                ? "Sending verification code..."
                : INSTRUCTIONS_TEXT[0].otpSubInstruction}
            </Text>
            {sendingOTP && (
              <Box className="mt-2">
                <ActivityIndicator size="small" color="#666" />
              </Box>
            )}
          </Box>
          <OTPComponent onComplete={handleOtpChange} />
        </Box>
      </ScrollView>
      <Fab
        size="lg"
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        isDisabled={otpValue.length !== 6 || loading}
        onPress={() => {
          console.log('🔘 Next button pressed!');
          console.log('🔘 Current OTP value:', otpValue);
          console.log('🔘 OTP length:', otpValue.length);
          handleVerifyOTP();
        }}
        style={{
          marginBottom: keyboardHeight > 0
            ? keyboardHeight + 10
            : Math.max(insets.bottom, 20)
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <FabIcon as={ChevronRightIcon} />
        )}
      </Fab>
    </KeyboardAvoidingView>
  );
}
