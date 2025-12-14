import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon, SearchIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Input, InputSlot, InputIcon, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";

const interests = () => {
  const interestsList = [
    "Travelling",
    "Photography",
    "Reading",
    "Music",
    "Cooking",
    "Gaming",
    "Sports",
    "Art",
    "Technology",
    "Movies",
    "Fitness",
    "Nature",
    "Rock Climbing",
  ];

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const filteredInterests = interestsList.filter((interest) =>
    interest.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(8 / 9) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <Box className="w-full gap-6">
          <Heading className="font-roboto font-semibold text-2xl">
            What are your interests?
          </Heading>

          <VStack className="gap-[72px]">
            <VStack className="gap-8">
              <Input className="border-typography-200" size="lg">
                <InputField
                  placeholder="Search your interests"
                  className=" font-normal font-roboto py-2"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <InputSlot className="pr-3.5">
                  <InputIcon as={SearchIcon} className="text-typography-300" />
                </InputSlot>
              </Input>
              <Box className="flex flex-row flex-wrap gap-2">
                {filteredInterests.map((interest, index) => (
                  <Pressable
                    key={index}
                    onPress={() => toggleInterest(interest)}
                    className={`bg-background-100 py-2 px-4 rounded-3xl border ${
                      selectedInterests.includes(interest)
                        ? "border border-primary-400 bg-transparent"
                        : ""
                    }`}
                  >
                    <Text className="text-white font-sfpro text-sm font-normal">
                      {interest}
                    </Text>
                  </Pressable>
                ))}
              </Box>
            </VStack>
            <HStack className="justify-between items-center bg-background-50 p-3 rounded-lg w-full gap-2">
              <Text className="flex-1">
                Didn’t find your interests here? Just go on add it!
              </Text>
              <Button className="bg-background-900 px-4 rounded-[4px] data-[active=true]:bg-background-700">
                <ButtonText className="text-typography-50 data-[active=true]:text-typography-0 font-roboto font-medium text-sm">
                  Add New
                </ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
      <Fab
        size="lg"
        onPress={() => {
          router.push("/onboarding/profile-answers");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default interests;
