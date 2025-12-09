import React, { useState } from "react";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { ActivityIndicator } from "react-native";

export const InstaCard = ({ img }: { img: string[] }) => {
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  // Helper function to convert string to proper image source format
  const getImageSource = (imageUrl: string | undefined) => {
    if (!imageUrl) return null;
    // If it's a URL (starts with http), wrap in { uri: }
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('file'))) {
      return { uri: imageUrl };
    }
    // Otherwise, assume it's a require() statement
    return imageUrl;
  };

  const handleImageLoadStart = (imageUrl: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleImageLoadEnd = (imageUrl: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUrl]: false }));
  };

  const ImageWithLoader = ({ imageUrl, index }: { imageUrl: string; index: number }) => {
    const source = getImageSource(imageUrl);
    if (!source) return null;

    return (
      <Box className="rounded-lg flex-1 aspect-square relative">
        {imageLoading[imageUrl] && (
          <Box className="absolute inset-0 items-center justify-center bg-background-900/50 rounded-lg z-10">
            <ActivityIndicator size="small" color="#fff" />
          </Box>
        )}
        <Image
          source={source}
          className="w-full h-full rounded-lg"
          alt={`instagram-${index}`}
          onLoadStart={() => handleImageLoadStart(imageUrl)}
          onLoadEnd={() => handleImageLoadEnd(imageUrl)}
          onError={() => handleImageLoadEnd(imageUrl)}
        />
      </Box>
    );
  };

  return (
    <Box className="bg-background-50 rounded-lg p-5 gap-4">
      <Text className="font-roboto font-medium text-typography-500 leading-[18.75px]">
        My Instagram
      </Text>
      <Box className="gap-2">
        <HStack className="flex-wrap gap-2">
          {img[0] && <ImageWithLoader imageUrl={img[0]} index={0} />}
          {img[1] && <ImageWithLoader imageUrl={img[1]} index={1} />}
          {img[2] && <ImageWithLoader imageUrl={img[2]} index={2} />}
        </HStack>
        <HStack className="flex-wrap gap-2">
          {img[3] && <ImageWithLoader imageUrl={img[3]} index={3} />}
          {img[4] && <ImageWithLoader imageUrl={img[4]} index={4} />}
          {img[5] && <ImageWithLoader imageUrl={img[5]} index={5} />}
        </HStack>
      </Box>
    </Box>
  );
};
