import React from "react";
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
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Image } from "@/components/ui/image";
import { InfoOnboarding } from "@/components/shared/info-onboarding";

const pictures = () => {
  const insets = useSafeAreaInsets();
  return (
    <Box className="flex-1 bg-background-0 gap-4 justify-start items-center pb-[100px]">
      <Box className="flex-1 justify-start items-start gap-11 px-5 top-11 w-[100%]">
        <Progress
          value={(7 / 9) * 100}
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
            {[
              require("@/assets/images/common/profile_avatar.png"),
              require("@/assets/images/common/onboarding_1_preview.png"),
              require("@/assets/images/common/onboarding_2_preview.png"),
              require("@/assets/images/common/onboarding_3_preview.png"),
              false,
              false,
            ].map((image, index) => (
              <Box className="w-[31%] aspect-square" key={index}>
                {image ? (
                  <>
                    <Image
                      source={image}
                      className="w-full h-full object-cover rounded-lg"
                      alt="instagram"
                    />
                    <Box className="absolute -top-3 right-2.5 bg-background-950 p-1 rounded-full">
                      <Icon
                        as={RemoveIcon}
                        className="text-typography-50 h-3 w-3"
                      />
                    </Box>
                    {image &&
                      (index === 0 ? (
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
                      ))}
                  </>
                ) : (
                  <Box className="w-full h-full rounded-lg items-center justify-center border border-background-100">
                    <Icon as={AddIcon} size="lg" />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          <InfoOnboarding info="Hold and draw photo/video to reorder" />
        </VStack>
      </Box>
      <Fab
        size="lg"
        onPress={() => {
          router.push("/onboarding/interests");
        }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
        style={{ marginBottom: -1 * insets.bottom }}
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default pictures;
