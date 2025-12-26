import React, { useState } from "react";
import { router } from "expo-router";
import { Platform, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField } from "@/components/ui/input";
import { updateOnboardingProgress } from "@/services/onboarding";
import DateTimePicker from "@react-native-community/datetimepicker";
import { InfoOnboarding } from "@/components/shared/info-onboarding";

const dob = () => {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState<Date>(new Date(2000, 0, 1)); // Default to Jan 1, 2000
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log("handleDateChange called, event type:", event?.type, "selectedDate:", selectedDate);

    if (Platform.OS === "android") {
      setShowPicker(false);
      // On Android, if user cancels, event.type will be 'dismissed'
      if (event.type === "dismissed" || !selectedDate) {
        console.log("Date picker dismissed or no date selected");
        return;
      }
    }

    if (selectedDate) {
      const age = calculateAge(selectedDate);
      console.log("Android - Calculated age:", age);

      if (age < 18) {
        console.log("Android - Age validation failed: too young");
        alert("You must be at least 18 years old to use this app.");
        setShowPicker(false);
        return;
      }
      if (age > 100) {
        console.log("Android - Age validation failed: too old");
        alert("Please enter a valid date of birth.");
        setShowPicker(false);
        return;
      }

      console.log("Android - Setting date and selectedDate:", selectedDate);
      setDate(selectedDate);
      setSelectedDate(selectedDate);
    }
  };

  const handleNext = async () => {
    try {
      console.log("handleNext called, selectedDate:", selectedDate);

      if (!selectedDate) {
        alert("Please select your date of birth");
        return;
      }

      // Validate age one more time before proceeding
      const age = calculateAge(selectedDate);
      if (age < 18) {
        alert("You must be at least 18 years old to use this app.");
        return;
      }
      if (age > 100) {
        alert("Please enter a valid date of birth.");
        return;
      }

      console.log("Updating onboarding progress with DOB:", selectedDate.toISOString());
      await updateOnboardingProgress("dob", {
        dob: selectedDate.toISOString(),
      });

      console.log("Navigation to gender screen");
      router.push("/(auth)/onboarding/gender");
    } catch (error) {
      console.error("Error in handleNext:", error);
      alert("An error occurred. Please try again.");
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
            value={(2 / 7) * 100}
            className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
          >
            <ProgressFilledTrack />
          </Progress>

          <VStack className="gap-6 w-full">
            <Heading className="font-roboto font-semibold text-2xl">
              What is your date of birth?
            </Heading>

            <VStack className="gap-4 w-full">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  console.log("Date picker pressed, showing picker");
                  setShowPicker(true);
                }}
                style={{ width: "100%" }}
              >
                <Input className="rounded-lg" size="lg" isReadOnly pointerEvents="none">
                  <InputField
                    placeholder="Select your date of birth"
                    value={selectedDate ? formatDate(selectedDate) : ""}
                    editable={false}
                  />
                </Input>
              </TouchableOpacity>

              {selectedDate && (
                <Text className="font-roboto text-typography-500 text-sm">
                  Age: {calculateAge(selectedDate)} years old
                </Text>
              )}

              {Platform.OS === "ios" && showPicker && (
                <VStack className="gap-4">
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    style={{ height: 200 }}
                  />
                  <Box className="flex-row gap-2 justify-end mt-2">
                    <Pressable
                      onPress={() => {
                        setShowPicker(false);
                        if (!selectedDate) {
                          setDate(new Date(2000, 0, 1));
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-background-100"
                    >
                      <Text className="text-typography-950 font-roboto">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        console.log("Done button pressed, date:", date);
                        const age = calculateAge(date);
                        console.log("Calculated age:", age);

                        if (age < 18) {
                          console.log("Age validation failed: too young");
                          alert("You must be at least 18 years old to use this app.");
                          return;
                        }
                        if (age > 100) {
                          console.log("Age validation failed: too old");
                          alert("Please enter a valid date of birth.");
                          return;
                        }

                        console.log("Setting selectedDate:", date);
                        setSelectedDate(date);
                        setShowPicker(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-background-950"
                    >
                      <Text className="text-typography-50 font-roboto">Done</Text>
                    </Pressable>
                  </Box>
                </VStack>
              )}

              {Platform.OS === "android" && showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                />
              )}
            </VStack>

            <InfoOnboarding info="You must be at least 18 years old to use this app" />
          </VStack>
        </Box>
      </ScrollView>
      <Fab
        size="lg"
        onPress={handleNext}
        isDisabled={!selectedDate}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default dob;
