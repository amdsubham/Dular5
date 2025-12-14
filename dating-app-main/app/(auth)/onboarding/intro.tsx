import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { ProgressFilledTrack } from "@/components/ui/progress";
import {
  FormControl,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/form-control";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon } from "@/components/ui/icon";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const intro = () => {
  const [textValue, setTextValue] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const words = textValue.trim() ? textValue.trim().split(/\s+/) : [];
    if (words.length !== wordCount) {
      setWordCount(words.length);
    }
  }, [textValue]);

  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(6 / 9) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <FormControl className="w-full gap-6">
          <Heading className="font-roboto font-semibold text-2xl">
            Write a small intro to yourself!
          </Heading>
          <Box>
            <Textarea className="bg-background-50 h-[150px]" size="lg">
              <TextareaInput
                placeholder="Write your cool intro here.."
                className="p-4 text-typography-800 items-start"
                multiline
                style={{ textAlignVertical: "top" }}
                onChangeText={(text) => {
                  setTextValue(text);
                }}
              />
            </Textarea>
            <FormControlHelper className="flex justify-end">
              <FormControlHelperText className="text-typography-400 font-roboto font-normal text-md">
                {wordCount} words/120
              </FormControlHelperText>
            </FormControlHelper>
          </Box>
        </FormControl>
      </Box>
      <Fab
        size="lg"
        onPress={() => {
          router.push("/onboarding/pictures");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default intro;
