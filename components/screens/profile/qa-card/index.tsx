import React from "react";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export const QACard = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  return (
    <Box className="bg-background-50 rounded-lg px-5 py-11 gap-4">
      <Text className="font-roboto font-medium text-typography-500 leading-[18.75px]">
        {question}
      </Text>
      <Heading className="font-roboto font-medium text-typography-950 text-2xl leading-[37.5px]">
        {answer}
      </Heading>
    </Box>
  );
};
