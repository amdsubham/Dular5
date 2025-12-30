import React, { useState } from "react";
import { router } from "expo-router";
import { ScrollView } from "react-native";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { FormControl } from "@/components/ui/form-control";
import { Progress } from "@/components/ui/progress";
import { analytics } from "@/services/analytics";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxLabel,
  CheckboxIndicator,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoOnboarding } from "@/components/shared/info-onboarding";
import { updateOnboardingProgress } from "@/services/onboarding";

const lookingFor = () => {
  const [values, setValues] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (values.length > 0) {
      await updateOnboardingProgress("looking-for", {
        lookingFor: values,
      });

      // Track looking for selected
      analytics.trackLookingForSelected(values);

      router.push("/(auth)/onboarding/pictures");
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
            value={(5 / 7) * 100}
            className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
          >
            <ProgressFilledTrack />
          </Progress>

          <FormControl className="w-full gap-6">
            <Heading className="font-roboto font-semibold text-2xl">
              What are you looking for on Dular?
            </Heading>

            <CheckboxGroup
              value={values}
              onChange={(keys) => setValues(keys)}
              className="gap-3"
            >
              <Checkbox
                value="casual-dates"
                size="md"
                className="bg-background-50 py-3 px-4 rounded-lg justify-between"
              >
                <CheckboxLabel className="font-roboto font-medium text-typography-950">
                  Casual Dates
                </CheckboxLabel>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
              <Checkbox
                value="long-term-relationship"
                size="md"
                className="bg-background-50 py-3 px-4 rounded-lg justify-between"
              >
                <CheckboxLabel className="font-roboto font-medium text-typography-950">
                  Long term Relationship
                </CheckboxLabel>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
              <Checkbox
                value="lets-see"
                size="md"
                className="bg-background-50 py-3 px-4 rounded-lg justify-between"
              >
                <CheckboxLabel className="font-roboto font-medium text-typography-950">
                  Lets see
                </CheckboxLabel>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
              <Checkbox
                value="marriage"
                size="md"
                className="bg-background-50 py-3 px-4 rounded-lg justify-between"
              >
                <CheckboxLabel className="font-roboto font-medium text-typography-950">
                  Marriage
                </CheckboxLabel>
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
            </CheckboxGroup>

            <InfoOnboarding
              info="This will help us match you to people who align to what you are
                looking for"
              classNameIcon="mt-1"
            />
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
export default lookingFor;
