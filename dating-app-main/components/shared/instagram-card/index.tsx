import React from "react";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";

export const InstaCard = ({ img }: { img: string[] }) => {
  return (
    <Box className="bg-background-50 rounded-lg p-5 gap-4">
      <Text className="font-roboto font-medium text-typography-500 leading-[18.75px]">
        My Instagram
      </Text>
      <Box className="gap-2">
        <HStack className="flex-wrap gap-2">
          <Image
            source={img[0]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
          <Image
            source={img[1]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
          <Image
            source={img[2]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
        </HStack>
        <HStack className="flex-wrap gap-2">
          <Image
            source={img[3]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
          <Image
            source={img[4]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
          <Image
            source={img[5]}
            className="rounded-lg flex-1 aspect-square"
            alt="instagram"
          />
        </HStack>
      </Box>
    </Box>
  );
};
