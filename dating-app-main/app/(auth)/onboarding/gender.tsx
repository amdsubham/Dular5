import React from "react";
import { router } from "expo-router";
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

const gender = () => {
  const insets = useSafeAreaInsets();
  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(3 / 9) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <FormControl className="w-full">
          <VStack className="gap-6">
            <Heading className="font-roboto font-semibold text-2xl">
              How do you identify yourself?
            </Heading>

            <VStack className="gap-4">
              <RadioGroup className="gap-3">
                <Radio
                  value="Woman"
                  size="md"
                  className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                >
                  <RadioLabel className="font-roboto font-medium text-typography-950">
                    Woman
                  </RadioLabel>
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                </Radio>
                <Radio
                  value="Man"
                  size="md"
                  className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                >
                  <RadioLabel className="font-roboto font-medium text-typography-950">
                    Man
                  </RadioLabel>
                  <RadioIndicator>
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                </Radio>
                <Radio
                  value="Nonbinary"
                  size="md"
                  className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                >
                  <RadioLabel className="font-roboto font-medium text-typography-950">
                    Nonbinary
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
      <Fab
        size="lg"
        onPress={() => {
          router.push("/onboarding/interest");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default gender;
