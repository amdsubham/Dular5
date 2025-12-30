import React, { useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
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
import { analytics } from "@/services/analytics";

const intro = () => {
  const [textValue, setTextValue] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  // Track screen view
  useFocusEffect(
    React.useCallback(() => {
      analytics.trackScreen("Onboarding_Intro");
      analytics.trackOnboardingStep("intro", false);
    }, [])
  );

  useEffect(() => {
    const words = textValue.trim() ? textValue.trim().split(/\s+/) : [];
    if (words.length !== wordCount) {
      setWordCount(words.length);
    }
  }, [textValue]);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background-0"
      keyboardVerticalOffset={0}
    >
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
      </ScrollView>
      <Fab
        size="lg"
        onPress={() => {
          router.push("/(auth)/onboarding/pictures");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{
          marginBottom: keyboardHeight > 0
            ? keyboardHeight + 10
            : Math.max(insets.bottom, 20)
        }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
    </KeyboardAvoidingView>
  );
};
export default intro;
