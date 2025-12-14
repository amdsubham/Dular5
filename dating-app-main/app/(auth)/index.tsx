import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneInput } from "@/components/shared/phone-input";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";

const INSTRUCTIONS_TEXT = [
  { loginInstruction: "Please enter your mobile number" },
  {
    loginSubInstruction:
      "We'll send you a verification code to confirm your number",
  },
];

export default function Index() {
  const router = useRouter();
  const [isValid, setIsValid] = useState(true);

  const handleValidationChange = (isValid: boolean) => {
    setIsValid(isValid);
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
          onPhoneChange={() => {}}
          onValidationChange={handleValidationChange}
        />
      </Box>
      <Fab
        size="lg"
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
        // isDisabled={!isValid}
        onPress={() => {
          router.push("/onboarding/otp");
        }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
}
