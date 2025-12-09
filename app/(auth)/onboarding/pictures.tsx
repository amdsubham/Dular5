import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import {
  AddIcon,
  ChevronRightIcon,
  Icon,
  RemoveIcon,
} from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Image } from "@/components/ui/image";
import { InfoOnboarding } from "@/components/shared/info-onboarding";
import { Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateOnboardingProgress } from "@/services/onboarding";
import { uploadMultipleImagesToFirebase } from "@/services/storage";

const MAX_IMAGES = 6;

const pictures = () => {
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<(string | null)[]>(Array(MAX_IMAGES).fill(null));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingImage, setCurrentUploadingImage] = useState(0);
  const [totalUploadingImages, setTotalUploadingImages] = useState(0);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to add pictures to your profile."
      );
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
        quality: 0.7, // Compress to 70% quality
      });

      if (!result.canceled && result.assets[0]) {
        // Further compress and resize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [
            { resize: { width: 800 } }, // Resize to max width of 800px (maintains aspect ratio)
          ],
          {
            compress: 0.7, // Additional compression to 70%
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const newImages = [...images];
        newImages[index] = manipulatedImage.uri;
        setImages(newImages);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const newImages = [...images];
            newImages[index] = null;
            setImages(newImages);
          },
        },
      ]
    );
  };

  const getImageSlots = () => {
    const slots: (string | null | false)[] = [];
    for (let i = 0; i < MAX_IMAGES; i++) {
      slots.push(images[i] || false);
    }
    return slots;
  };

  const hasAtLeastOneImage = images.some((img) => img !== null);

  const handleNext = async () => {
    if (!hasAtLeastOneImage) {
      Alert.alert("Required", "Please add at least one photo to continue.");
      return;
    }

    if (uploading) {
      Alert.alert("Please wait", "Images are still uploading. Please wait...");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Filter out null values and get local URIs
      const pictureUris = images.filter((img) => img !== null) as string[];
      setTotalUploadingImages(pictureUris.length);
      
      // Upload all images to Firebase Storage with progress tracking
      console.log("Uploading images to Firebase Storage...");
      const downloadURLs = await uploadMultipleImagesToFirebase(
        pictureUris,
        "user-profiles", // Changed from "onboarding-pictures" to "user-profiles"
        (overallProgress, currentImage, totalImages) => {
          setUploadProgress(overallProgress);
          setCurrentUploadingImage(currentImage);
        }
      );

      console.log("Images uploaded. URLs:", downloadURLs);

      // Store the URLs in Firestore
      await updateOnboardingProgress("pictures", {
        pictures: downloadURLs, // Store Firebase Storage URLs, not local URIs
      });

      console.log("Picture URLs saved to Firestore");
      
      // Navigate to next screen
      router.push("/onboarding/interests");
    } catch (error: any) {
      console.error("Error uploading images:", error);
      Alert.alert(
        "Upload Failed",
        error.message || "Failed to upload images. Please try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentUploadingImage(0);
      setTotalUploadingImages(0);
    }
  };

  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(6 / 7) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <VStack className="gap-6 w-full">
          <VStack className="gap-3">
            <Heading className="font-roboto font-semibold text-2xl">
              Add your pictures
            </Heading>
            <Text className="font-normal font-roboto text-typography-400">
              Choose photos where your face is clearly visible, also try to
              avoid blurred and poor quality images for your profile!
            </Text>
          </VStack>
          <Box className="flex-wrap justify-between gap-y-2.5 flex-row">
            {getImageSlots().map((image, index) => (
              <Box className="w-[31%] aspect-square relative" key={index}>
                {image ? (
                  <>
                    <Image
                      source={{ uri: image }}
                      className="w-full h-full object-cover rounded-lg"
                      alt={`Profile image ${index + 1}`}
                    />
                    <Pressable
                      onPress={() => removeImage(index)}
                      className="absolute -top-3 right-2.5 bg-background-950 p-1 rounded-full z-10"
                    >
                      <Icon
                        as={RemoveIcon}
                        className="text-typography-50 h-3 w-3"
                      />
                    </Pressable>
                    {index === 0 ? (
                      <Box className="absolute bottom-2 left-2 bg-secondary-500/70 py-1 px-2 rounded-full">
                        <Text className="text-secondary-800 text-2xs">
                          Main
                        </Text>
                      </Box>
                    ) : (
                      <Box className="absolute bottom-2 left-2 bg-background-50 h-5 w-5 items-center justify-center rounded-full">
                        <Text className="text-typography-500 text-2xs">
                          {index + 1}
                        </Text>
                      </Box>
                    )}
                  </>
                ) : (
                  <Pressable
                    onPress={() => pickImage(index)}
                    className="w-full h-full rounded-lg items-center justify-center border border-background-100"
                  >
                    <Icon as={AddIcon} size="lg" />
                  </Pressable>
                )}
              </Box>
            ))}
          </Box>
          <InfoOnboarding info="Hold and drag photo to reorder" />
          
          {/* Upload Progress Bar */}
          {uploading && (
            <VStack className="gap-2 w-full mt-4">
              <HStack className="justify-between items-center">
                <Text className="font-roboto text-typography-500 text-sm">
                  Uploading images...
                </Text>
                <Text className="font-roboto text-typography-500 text-sm">
                  {currentUploadingImage} / {totalUploadingImages}
                </Text>
              </HStack>
              <Progress
                value={uploadProgress}
                className="w-full rounded-full h-2 bg-background-600"
              >
                <ProgressFilledTrack />
              </Progress>
              <Text className="font-roboto text-typography-400 text-xs text-center">
                {uploadProgress.toFixed(0)}% complete
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
      <Fab
        size="lg"
        onPress={handleNext}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
        isDisabled={!hasAtLeastOneImage || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <FabIcon as={ChevronRightIcon} />
        )}
      </Fab>
    </Box>
  );
};
export default pictures;
