import React from "react";
import { useRouter, Stack } from "expo-router";
import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Box className="px-4 pt-8 pb-4 md:pt-10 md:pb-8 md:rounded-sm md:px-[140px] bg-background-0 flex-1 items-center">
          <Image
            source={require("assets/images/404.png")}
            alt="404 page"
            className="h-96 w-[422px] md:mt-16"
          />
          <Heading className="mt-10 text-2xl text-center text-typography-800 ">
            Oops! Page not found
          </Heading>
          <Text className="text-sm mt-2 mb-8 text-center max-w-72 md:max-w-[372px]">
            The page you are looking for might have been removed, had it’s name
            changed, or is temporary unavailable
          </Text>
          <Button
            onPress={() => {
              router.push("/");
            }}
            className="border-0"
            variant="outline"
          >
            <ButtonText className="">Go to home screen!</ButtonText>
          </Button>
        </Box>
      </ScrollView>
    </>
  );
}
