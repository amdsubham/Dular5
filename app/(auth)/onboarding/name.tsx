import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Input, InputField } from "@/components/ui/input";
import { InfoOnboarding } from "@/components/shared/info-onboarding";
import { updateOnboardingProgress } from "@/services/onboarding";

const name = () => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleNext = async () => {
    if (firstName.trim() && lastName.trim()) {
      await updateOnboardingProgress("name", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.push("/onboarding/dob");
    }
  };

  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(1 / 7) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <VStack className="gap-6 w-full">
          <Heading className="font-roboto font-semibold text-2xl">
            What is your name?
          </Heading>

          <VStack className="gap-4">
            <Input className="rounded-lg" size="lg">
              <InputField 
                placeholder="First Name" 
                value={firstName}
                onChangeText={setFirstName}
              />
            </Input>
            <Input className="rounded-lg" size="lg">
              <InputField 
                placeholder="Last Name" 
                value={lastName}
                onChangeText={setLastName}
              />
            </Input>
          </VStack>

          <InfoOnboarding info="This will be used to match you to people" />
        </VStack>
      </Box>
      <Fab
        size="lg"
        onPress={handleNext}
        isDisabled={!firstName.trim() || !lastName.trim()}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default name;
