import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const handleNext = async () => {
    if (firstName.trim() && lastName.trim()) {
      await updateOnboardingProgress("name", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.push("/(auth)/onboarding/dob");
    }
  };

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
      </ScrollView>
      <Fab
        size="lg"
        onPress={handleNext}
        isDisabled={!firstName.trim() || !lastName.trim()}
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
export default name;
