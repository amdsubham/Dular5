import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
  AddIcon,
  Icon,
  InfoIcon,
  RemoveIcon,
  CloseIcon,
} from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Alert, ActivityIndicator } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Input, InputField } from "@/components/ui/input";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxLabel,
  CheckboxIndicator,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import {
  getUserProfile,
  updateUserProfile,
  UserProfile,
  calculateAge,
} from "@/services/profile";
import {
  uploadMultipleImagesToFirebase,
  deleteImageFromFirebase,
} from "@/services/storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Animated, { SlideInLeft, SlideOutLeft } from "react-native-reanimated";
import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import {
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioLabel,
  RadioIcon,
} from "@/components/ui/radio";
import { CircleIcon } from "@/components/ui/icon";

const AnimatedBox = Animated.createAnimatedComponent(Box);
const MAX_IMAGES = 6;

export const EditScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<(string | null)[]>(
    Array(MAX_IMAGES).fill(null)
  );
  const [dob, setDob] = useState<Date | null>(null);
  const [tempDob, setTempDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Modal states
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showLookingForModal, setShowLookingForModal] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [interestSearch, setInterestSearch] = useState("");

  // Auto-save timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Available options
  const availableInterests = [
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
    "Dancing",
    "Writing",
    "Yoga",
    "Cycling",
    "Swimming",
    "Painting",
    "Singing",
  ];

  const lookingForOptions = [
    "Casual Dates",
    "Long term Relationship",
    "Lets see",
    "Marriage",
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-save function with debounce
  const autoSave = useCallback(async () => {
    if (loading || !profile) return; // Don't save during initial load

    try {
      setSaving(true);

      // Upload new local images
      const localImages = pictures.filter(
        (img) => img && !img.startsWith("http")
      ) as string[];
      const existingImages = pictures.filter(
        (img) => img && img.startsWith("http")
      ) as string[];

      let uploadedUrls: string[] = [];
      if (localImages.length > 0) {
        setUploading(true);
        uploadedUrls = await uploadMultipleImagesToFirebase(
          localImages,
          "user-profiles",
          (progress) => setUploadProgress(progress)
        );
        setUploading(false);
      }

      const allPictureUrls = [...existingImages, ...uploadedUrls].filter(
        Boolean
      );

      // Update profile
      await updateUserProfile({
        firstName,
        lastName,
        gender,
        lookingFor,
        interests,
        pictures: allPictureUrls,
        dob: dob?.toISOString(),
      });

      setLastSaved(new Date());
    } catch (error: any) {
      console.error("Error auto-saving profile:", error);
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [firstName, lastName, gender, lookingFor, interests, pictures, dob, loading, profile]);

  // Trigger auto-save with debounce when form data changes
  useEffect(() => {
    if (loading || !profile) return; // Skip during initial load

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second delay)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [firstName, lastName, gender, lookingFor, interests, pictures, dob, autoSave, loading, profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setFirstName(userProfile.firstName || "");
        setLastName(userProfile.lastName || "");
        setGender(userProfile.gender || "");
        setLookingFor(userProfile.lookingFor || []);
        setInterests(userProfile.interests || []);

        // Load pictures
        if (userProfile.pictures && userProfile.pictures.length > 0) {
          const pics = [...userProfile.pictures];
          while (pics.length < MAX_IMAGES) {
            pics.push(null);
          }
          setPictures(pics.slice(0, MAX_IMAGES));
        }

        // Load DOB
        if (userProfile.dob) {
          setDob(new Date(userProfile.dob));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need access to your photos.");
      return false;
    }
    return true;
  };

  const pickImage = async (index: number) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const newPictures = [...pictures];
        newPictures[index] = manipulatedImage.uri;
        setPictures(newPictures);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = pictures[index];
    if (!imageUrl) return;

    Alert.alert("Remove Photo", "Are you sure you want to remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const newPictures = [...pictures];
          // If it's a Firebase URL, delete from storage
          if (imageUrl.startsWith("http")) {
            try {
              await deleteImageFromFirebase(imageUrl);
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          }
          newPictures[index] = null;
          setPictures(newPictures);
        },
      },
    ]);
  };

  const handleDragEnd = ({ data }: { data: (string | null)[] }) => {
    setPictures(data);
  };

  const renderDraggableItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<string | null>) => {
    const index = getIndex() ?? 0;

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={200}
          disabled={!item}
          className="w-[47%] aspect-square mb-2.5"
          style={{
            opacity: isActive ? 0.6 : 1,
          }}
        >
          {item ? (
            <>
              <Box className="w-full h-full relative">
                {imageLoading[index] && (
                  <Box className="absolute inset-0 items-center justify-center bg-background-900/50 rounded-lg z-20">
                    <ActivityIndicator size="large" color="#fff" />
                  </Box>
                )}
                <Image
                  source={{ uri: item }}
                  className="w-full h-full object-cover rounded-lg"
                  alt={`Profile image ${index + 1}`}
                  onLoadStart={() =>
                    setImageLoading((prev) => ({ ...prev, [index]: true }))
                  }
                  onLoadEnd={() =>
                    setImageLoading((prev) => ({ ...prev, [index]: false }))
                  }
                  onError={() =>
                    setImageLoading((prev) => ({ ...prev, [index]: false }))
                  }
                />
                {index === 0 ? (
                  <Box className="absolute bottom-2 left-2 bg-secondary-500/80 py-1 px-2.5 rounded-full">
                    <Text className="text-secondary-900 text-2xs font-medium font-roboto">
                      Main
                    </Text>
                  </Box>
                ) : (
                  <Box className="absolute bottom-2 left-2 bg-background-50 h-5 w-5 items-center justify-center rounded-full">
                    <Text className="text-typography-500 text-2xs font-medium font-roboto">
                      {index + 1}
                    </Text>
                  </Box>
                )}
              </Box>
              <Pressable
                onPress={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-600 p-1.5 rounded-full z-40 shadow-lg"
              >
                <Icon
                  as={RemoveIcon}
                  className="text-white h-3 w-3"
                />
              </Pressable>
            </>
          ) : (
            <Box className="w-full h-full rounded-lg items-center justify-center border-2 border-dashed border-background-200 bg-background-50">
              <Icon as={AddIcon} size="lg" className="text-background-400" />
            </Box>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  };

  const addNewInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter an interest name");
      return;
    }
    if (interests.includes(trimmed)) {
      Alert.alert("Error", "This interest is already selected");
      return;
    }
    if (availableInterests.includes(trimmed)) {
      Alert.alert("Error", "This interest already exists in the list. Please select it from the options above.");
      return;
    }
    if (interests.length >= 10) {
      Alert.alert("Limit Reached", "You can select up to 10 interests");
      return;
    }
    setInterests([...interests, trimmed]);
    setNewInterest("");
    setShowInterestsModal(false);
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (loading) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-typography-500">Loading profile...</Text>
      </Box>
    );
  }

  const filteredInterests = availableInterests.filter((interest) =>
    interest.toLowerCase().includes(interestSearch.toLowerCase())
  );

  return (
    <AnimatedBox
      className="flex-1 gap-5 p-4 pt-0 w-full bg-background-0"
      entering={SlideInLeft}
      exiting={SlideOutLeft}
    >
      {/* Photos - Moved to top */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium mb-1 font-roboto">
          My Photos & Videos
        </Text>
        <DraggableFlatList
          data={pictures}
          onDragEnd={handleDragEnd}
          keyExtractor={(item, index) => `picture-${index}`}
          renderItem={renderDraggableItem}
          numColumns={2}
          scrollEnabled={false}
          containerStyle={{ flexWrap: "wrap", justifyContent: "space-between" }}
        />
        {uploading && (
          <VStack className="gap-2 bg-background-50 p-4 rounded-xl">
            <HStack className="justify-between items-center">
              <Text className="text-typography-700 text-sm font-medium font-roboto">
                Uploading images...
              </Text>
              <Text className="text-primary-500 text-sm font-bold font-roboto">
                {uploadProgress}%
              </Text>
            </HStack>
            <Box className="h-2 bg-background-200 rounded-full overflow-hidden">
              <Box
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </Box>
          </VStack>
        )}
        <HStack className="justify-center gap-2 items-center">
          <Icon as={InfoIcon} className="text-typography-500" />
          <Text className="text-typography-500 text-sm font-medium font-roboto">
            Hold and drag photo to reorder
          </Text>
        </HStack>
      </Box>

      {/* Name */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium">Name</Text>
        <HStack className="gap-2">
          <Input className="flex-1 rounded-lg" size="lg">
            <InputField
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
          </Input>
          <Input className="flex-1 rounded-lg" size="lg">
            <InputField
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </Input>
        </HStack>
      </Box>

      {/* Date of Birth */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium">
          Date of Birth
        </Text>
        <Pressable
          onPress={() => {
            setTempDob(dob);
            setShowDobPicker(true);
          }}
        >
          <Box className="pointer-events-none">
            <Input className="rounded-lg" size="lg" isReadOnly>
              <InputField
                placeholder="Select date of birth"
                value={dob ? formatDate(dob) : ""}
                editable={false}
              />
            </Input>
          </Box>
        </Pressable>
        {dob && (
          <Text className="text-typography-500 text-sm">
            Age: {calculateAge(dob.toISOString())} years old
          </Text>
        )}
        {showDobPicker && (
          <>
            <DateTimePicker
              value={tempDob || dob || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDobPicker(false);
                  if (selectedDate) {
                    setDob(selectedDate);
                  }
                } else {
                  // iOS - update temp date as user scrolls
                  if (selectedDate) {
                    setTempDob(selectedDate);
                  }
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
            {Platform.OS === "ios" && (
              <HStack className="gap-2 justify-end mt-2">
                <Button
                  onPress={() => {
                    setShowDobPicker(false);
                    setTempDob(null);
                  }}
                  variant="outline"
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  onPress={() => {
                    if (tempDob) {
                      setDob(tempDob);
                    }
                    setShowDobPicker(false);
                    setTempDob(null);
                  }}
                >
                  <ButtonText>Done</ButtonText>
                </Button>
              </HStack>
            )}
          </>
        )}
      </Box>

      {/* Gender */}
      <Box className="gap-3">
        <Text className="text-typography-950 text-base font-medium">
          Gender
        </Text>
        <RadioGroup value={gender} className="gap-3">
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
            value="Nonbinary"
            size="md"
            className="bg-background-50 py-3 px-4 rounded-lg justify-between"
            onPress={() => setGender("Nonbinary")}
          >
            <RadioLabel className="font-roboto font-medium text-typography-950">
              Nonbinary
            </RadioLabel>
            <RadioIndicator>
              <RadioIcon as={CircleIcon} />
            </RadioIndicator>
          </Radio>
        </RadioGroup>
      </Box>

      {/* Looking For */}
      <Box className="gap-3">
        <HStack className="justify-between items-center">
          <Text className="text-typography-950 text-base font-medium">
            Looking For
          </Text>
          <Button
            className="p-1.5 bg-background-100 data-[active=true]:bg-background-200 h-auto"
            onPress={() => setShowLookingForModal(true)}
          >
            <ButtonIcon as={AddIcon} className="text-typography-900" />
          </Button>
        </HStack>
        <Box className="flex-wrap flex-row gap-2 p-4 border border-background-100 rounded-lg">
          {lookingFor.length === 0 ? (
            <Text className="text-typography-500 text-sm">
              No preferences selected
            </Text>
          ) : (
            lookingFor.map((item) => (
              <Box
                key={item}
                className="bg-background-100 px-4 py-2 rounded-full"
              >
                <Text className="text-typography-950 text-xs">{item}</Text>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Interests */}
      <Box className="gap-3">
        <HStack className="justify-between items-center">
          <Text className="text-typography-950 text-base font-medium mb-1">
            Interests ({interests.length}/10)
          </Text>
        </HStack>

        {/* Search Input */}
        <Input className="border-typography-200 rounded-lg" size="lg">
          <InputField
            placeholder="Search interests"
            className="font-normal font-roboto"
            value={interestSearch}
            onChangeText={setInterestSearch}
          />
        </Input>

        {/* All Available Interests as Toggleable Pills */}
        <Box className="flex-wrap flex-row gap-2 min-h-[100px]">
          {filteredInterests.map((interest) => (
            <Pressable
              key={interest}
              onPress={() => {
                if (interests.includes(interest)) {
                  setInterests(interests.filter((i) => i !== interest));
                } else {
                  if (interests.length < 10) {
                    setInterests([...interests, interest]);
                  } else {
                    Alert.alert("Limit Reached", "You can select up to 10 interests");
                  }
                }
              }}
              className={`py-2 px-4 rounded-full border ${
                interests.includes(interest)
                  ? "border-primary-500 bg-primary-50"
                  : "bg-background-100 border-background-100"
              }`}
            >
              <Text
                className={`font-roboto text-sm ${
                  interests.includes(interest)
                    ? "text-primary-700 font-medium"
                    : "text-typography-700"
                }`}
              >
                {interest}
              </Text>
            </Pressable>
          ))}
        </Box>

        {/* Add Custom Interest Section */}
        <HStack className="justify-between items-center bg-background-50 p-3 rounded-lg gap-2">
          <Text className="flex-1 text-typography-700 text-sm">
            Didn't find your interests? Add a custom one!
          </Text>
          <Button
            className="bg-background-900 px-4 rounded data-[active=true]:bg-background-700"
            size="sm"
            onPress={() => setShowInterestsModal(true)}
          >
            <ButtonText className="text-typography-50 font-roboto font-medium text-sm">
              Add New
            </ButtonText>
          </Button>
        </HStack>
      </Box>

      {/* Auto-save indicator */}
      {(saving || uploading) && (
        <Box className="flex-row items-center justify-center gap-2 py-3 bg-background-50 rounded-lg mt-4">
          <ActivityIndicator size="small" />
          <Text className="text-typography-600 text-sm font-roboto">
            {uploading ? `Uploading images... ${uploadProgress}%` : "Saving changes..."}
          </Text>
        </Box>
      )}
      {lastSaved && !saving && !uploading && (
        <Box className="items-center py-2">
          <Text className="text-typography-500 text-xs font-roboto">
            Last saved: {lastSaved.toLocaleTimeString()}
          </Text>
        </Box>
      )}

      {/* Add Custom Interest Modal */}
      <Modal
        isOpen={showInterestsModal}
        onClose={() => {
          setShowInterestsModal(false);
          setNewInterest("");
        }}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text className="text-typography-950 font-semibold text-lg">
              Add Custom Interest
            </Text>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack className="gap-4">
              <Text className="text-typography-600 text-sm">
                Enter a custom interest that's not in the list
              </Text>
              <Input className="rounded-lg" size="lg">
                <InputField
                  placeholder="Enter interest name"
                  value={newInterest}
                  onChangeText={setNewInterest}
                  onSubmitEditing={addNewInterest}
                />
              </Input>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onPress={() => {
                setShowInterestsModal(false);
                setNewInterest("");
              }}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button onPress={addNewInterest}>
              <ButtonText>Add</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Looking For Modal */}
      <Modal
        isOpen={showLookingForModal}
        onClose={() => setShowLookingForModal(false)}
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text className="text-typography-950 font-semibold">
              What are you looking for?
            </Text>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <CheckboxGroup
              value={lookingFor}
              onChange={(keys) => setLookingFor(keys as string[])}
              className="gap-3"
            >
              {lookingForOptions.map((option) => (
                <Checkbox
                  key={option}
                  value={option}
                  size="md"
                  className="bg-background-50 py-3 px-4 rounded-lg justify-between"
                >
                  <CheckboxLabel className="font-roboto font-medium text-typography-950">
                    {option}
                  </CheckboxLabel>
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setShowLookingForModal(false)}>
              <ButtonText>Done</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AnimatedBox>
  );
};
