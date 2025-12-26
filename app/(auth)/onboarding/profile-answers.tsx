import React from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressFilledTrack } from "@/components/ui/progress";
import { Progress } from "@/components/ui/progress";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Fab, FabIcon } from "@/components/ui/fab";
import {
  Accordion,
  AccordionIcon,
  AccordionContent,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContentText,
} from "@/components/ui/accordion";
import { ScrollView } from "@/components/ui/scroll-view";
import { InfoOnboarding } from "@/components/shared/info-onboarding";

const profileAnswers = () => {
  const insets = useSafeAreaInsets();
  const prompts = [
    {
      id: "1",
      question: "If your friends could describe you in one word?",
      placeholder: `"Unpredictable" - Half tech nerd, half wilderness explorer. Never a dull moment.`,
    },
    {
      id: "2",
      question: "Two truths and a lie...",
      placeholder: "Write three statements, make one false...",
    },
    {
      id: "3",
      question: "My perfect Sunday looks like...",
      placeholder: "Describe your ideal Sunday...",
    },
    {
      id: "4",
      question: "My biggest passion in life is...",
      placeholder: "Tell us what drives you...",
    },
    {
      id: "5",
      question: "One thing I'm looking for in a partner...",
      placeholder: "Share what matters most to you...",
    },
    {
      id: "6",
      question: "Weirdest talent that might surprise you?",
      placeholder:
        "I can make the world's most perfect pancake stack AND solve a Rubik's cube in under 3 minutes. Breakfast + brain skills combo! 🥞🧩",
    },
    {
      id: "7",
      question: "Most embarrassing travel moment?",
      placeholder:
        "Got completely lost in Tokyo, accidentally joined a traditional dance parade. Ended up becoming an unexpected tourist attraction! 😂",
    },
  ];

  return (
    <Box className="flex-1 bg-background-0">
      <Box className="flex-1 justify-start items-start gap-11 px-5 pt-11 w-[100%] pb-[100px]">
        <Progress
          value={(9 / 9) * 100}
          className="w-1/2 mx-auto rounded-full h-1 bg-background-600"
        >
          <ProgressFilledTrack />
        </Progress>

        <VStack className="gap-[18px] flex-1 w-full pb-4">
          <VStack className="gap-3">
            <Heading className="font-roboto font-semibold text-2xl">
              Write your profile answers
            </Heading>
            <VStack className="gap-2">
              <Text className="font-roboto font-normal text-base text-typography-400 leading-6">
                Select a prompt that excites you from the list below and write
                your answer!
              </Text>
            </VStack>
          </VStack>
          <VStack className="gap-[16px] flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom + 80, 100),
              }}
            >
              <Accordion className="w-full bg-transparent gap-4">
                {prompts.map((prompt) => (
                  <AccordionItem
                    key={prompt.id}
                    value={`item-${prompt.id}`}
                    className="rounded-lg bg-background-50"
                  >
                    <AccordionHeader>
                      <AccordionTrigger className="focus:web:rounded-lg">
                        {({ isExpanded }) => {
                          return (
                            <>
                              <AccordionTitleText
                                className={`font-roboto font-medium text-sm leading-4 ${
                                  isExpanded ? "text-typography-400" : ""
                                }`}
                              >
                                {prompt.question}
                              </AccordionTitleText>
                              {isExpanded ? (
                                <AccordionIcon
                                  as={ChevronUpIcon}
                                  className="py-3 pr-4 text-background-400"
                                  size="md"
                                />
                              ) : (
                                <AccordionIcon
                                  as={ChevronDownIcon}
                                  className="py-3 pr-4 text-background-400"
                                  size="md"
                                />
                              )}
                            </>
                          );
                        }}
                      </AccordionTrigger>
                    </AccordionHeader>
                    <AccordionContent>
                      <AccordionContentText className="font-semibold font-roboto text-2xl text-typography-800 leading-7">
                        {prompt.placeholder}
                      </AccordionContentText>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollView>
            <InfoOnboarding info="Pick a maximum of 3 questions for your profile" />
          </VStack>
        </VStack>
      </Box>
      <Fab
        size="lg"
        onPress={() => {
          router.push("/(auth)/onboarding/done");
        }}
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
        className="bg-background-950 rounded-lg absolute bottom-11 right-5 data-[active=true]:bg-background-900"
      >
        <FabIcon as={ChevronRightIcon} />
      </Fab>
    </Box>
  );
};
export default profileAnswers;
