import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronRightIcon, SearchIcon, CloseIcon, Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Input, InputSlot, InputIcon, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable, Alert } from "react-native";
import { Modal } from "@/components/ui/modal";
import { ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@/components/ui/modal";
import { updateOnboardingProgress } from "@/services/onboarding";

const interests = () => {
  const [interestsList, setInterestsList] = useState<string[]>([
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
  ]);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInterest, setNewInterest] = useState<string>("");

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter an interest name");
      return;
    }
    
    if (interestsList.includes(trimmed)) {
      Alert.alert("Error", "This interest already exists");
      return;
    }

    setInterestsList((prev) => [...prev, trimmed]);
    setSelectedInterests((prev) => [...prev, trimmed]);
    setNewInterest("");
    setShowAddModal(false);
  };

  const filteredInterests = interestsList.filter((interest) =>
    interest.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (selectedInterests.length > 0) {
      await updateOnboardingProgress("interests", {
        interests: selectedInterests,
      });
      router.push("/(auth)/onboarding/location");
    } else {
      Alert.alert("Required", "Please select at least one interest to continue.");
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
            value={(7 / 7) * 100}
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
                <Text className="flex-1 text-typography-950">
                  Didn't find your interests here? Just go on add it!
                </Text>
                <Button
                  className="bg-background-900 px-4 rounded-[4px] data-[active=true]:bg-background-700"
                  onPress={() => setShowAddModal(true)}
                >
                  <ButtonText className="text-typography-50 data-[active=true]:text-typography-0 font-roboto font-medium text-sm">
                    Add New
                  </ButtonText>
                </Button>
              </HStack>

              <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <ModalBackdrop />
                <ModalContent>
                  <ModalHeader>
                    <Heading>Add New Interest</Heading>
                    <ModalCloseButton>
                      <Icon as={CloseIcon} className="text-typography-500" />
                    </ModalCloseButton>
                  </ModalHeader>
                  <ModalBody>
                    <VStack className="gap-4">
                      <Input className="rounded-lg" size="lg">
                        <InputField
                          placeholder="Enter interest name"
                          value={newInterest}
                          onChangeText={setNewInterest}
                          onSubmitEditing={handleAddInterest}
                        />
                      </Input>
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setShowAddModal(false);
                        setNewInterest("");
                      }}
                    >
                      <ButtonText>Cancel</ButtonText>
                    </Button>
                    <Button onPress={handleAddInterest}>
                      <ButtonText>Add</ButtonText>
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </VStack>
          </Box>
        </Box>
      </ScrollView>
      <Fab
        size="lg"
        onPress={handleNext}
        isDisabled={selectedInterests.length === 0}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default interests;
