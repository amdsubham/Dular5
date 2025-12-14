import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { OTPComponent } from "@/components/shared/otp-input";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";

const INSTRUCTIONS_TEXT = [
  {
    otpInstruction: "Enter verification code",
    otpSubInstruction:
      "We have sent you a verification code to your mobile number",
  },
];

export default function Otp() {
  const [otpValue, setOtpValue] = useState("1234");
  const router = useRouter();

  const handleOtpChange = (otp: string) => {
    setOtpValue(otp);
  };
  const insets = useSafeAreaInsets();
  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      {/* <OnboardingHeader /> */}
      <Box className="flex-1 justify-start items-center gap-12 px-5 top-20">
        <Box className="flex justify-start gap-3">
          <Text className="font-roboto text-2xl font-semibold leading-7">
            {INSTRUCTIONS_TEXT[0].otpInstruction}
          </Text>
          <Text className="font-roboto text-typography-500 leading-6">
            {INSTRUCTIONS_TEXT[0].otpSubInstruction}
          </Text>
        </Box>
        <OTPComponent onComplete={handleOtpChange} />
      </Box>
      <Fab
        size="lg"
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        isDisabled={otpValue.length !== 4}
        onPress={() => router.push("/onboarding/verified")}
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
}
