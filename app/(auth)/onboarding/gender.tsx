import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { FormControl } from "@/components/ui/form-control";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon, CircleIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Fab, FabIcon } from "@/components/ui/fab";
import {
  Radio,
  RadioIndicator,
  RadioLabel,
  RadioIcon,
  RadioGroup,
} from "@/components/ui/radio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoOnboarding } from "@/components/shared/info-onboarding";
import { updateOnboardingProgress } from "@/services/onboarding";

const gender = () => {
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<string>("");

  const handleNext = async () => {
    if (gender) {
      await updateOnboardingProgress("gender", {
        gender,
      });
      router.push("/(auth)/onboarding/interest");
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + 80, 100),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="flex-1 justify-start items-start gap-11 px-5 pt-11 w-[100%]">
          <Progress
            value={(3 / 7) * 100}
            className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
          >
            <ProgressFilledTrack />
          </Progress>

          <FormControl className="w-full">
            <VStack className="gap-6">
              <Heading className="font-roboto font-semibold text-2xl">
                What is your gender?
              </Heading>

              <VStack className="gap-4">
                <RadioGroup
                  value={gender}
                  className="gap-3"
                >
                  <Radio
                    value="Man"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                    onPress={() => setGender("Man")}
                  >
                    <RadioLabel className="font-roboto font-medium text-typography-950">
                      Man
                    </RadioLabel>
                    <RadioIndicator>
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                  </Radio>
                  <Radio
                    value="Woman"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                    onPress={() => setGender("Woman")}
                  >
                    <RadioLabel className="font-roboto font-medium text-typography-950">
                      Woman
                    </RadioLabel>
                    <RadioIndicator>
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                  </Radio>
                  <Radio
                    value="Other"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                    onPress={() => setGender("Other")}
                  >
                    <RadioLabel className="font-roboto font-medium text-typography-950">
                      Other
                    </RadioLabel>
                    <RadioIndicator>
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                  </Radio>
                </RadioGroup>
              </VStack>

              <InfoOnboarding
                info="You can change these details after onboarding as well!"
                classNameIcon="mt-1"
              />
            </VStack>
          </FormControl>
        </Box>
      </ScrollView>
      <Fab
        size="lg"
        onPress={handleNext}
        isDisabled={!gender}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default gender;
