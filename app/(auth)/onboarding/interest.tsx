import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { FormControl } from "@/components/ui/form-control";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Fab, FabIcon } from "@/components/ui/fab";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxLabel,
  CheckboxIndicator,
} from "@/components/ui/checkbox";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoOnboarding } from "@/components/shared/info-onboarding";
import { updateOnboardingProgress } from "@/services/onboarding";

const interest = () => {
  const [values, setValues] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (values.length > 0) {
      await updateOnboardingProgress("interest", {
        interestedIn: values,
      });
      router.push("/onboarding/looking-for");
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
            value={(4 / 7) * 100}
            className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
          >
            <ProgressFilledTrack />
          </Progress>

          <FormControl className="w-full">
            <VStack className="gap-6">
              <Heading className="font-roboto font-semibold text-2xl">
                I would like to meet
              </Heading>

              <VStack className="gap-4">
                <CheckboxGroup
                  value={values}
                  onChange={(keys) => setValues(keys)}
                  className="gap-3"
                >
                  <Checkbox
                    value="Woman"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                  >
                    <CheckboxLabel className="font-roboto font-medium text-typography-950">
                      Woman
                    </CheckboxLabel>
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                  </Checkbox>
                  <Checkbox
                    value="Man"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                  >
                    <CheckboxLabel className="font-roboto font-medium text-typography-950">
                      Man
                    </CheckboxLabel>
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                  </Checkbox>
                  <Checkbox
                    value="Nonbinary"
                    size="md"
                    className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                  >
                    <CheckboxLabel className="font-roboto font-medium text-typography-950">
                      Nonbinary
                    </CheckboxLabel>
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                  </Checkbox>
                </CheckboxGroup>
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
        isDisabled={values.length === 0}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default interest;
