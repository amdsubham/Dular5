import { Icon, InfoIcon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

export const InfoOnboarding = ({ info, classNameIcon }: { info: string, classNameIcon?: string }) => {
  return (
    <HStack className="gap-[6px] w-full items-start justify-start">
      <Icon as={InfoIcon} className={`text-typography-300 ${classNameIcon}`} />
      <Text className="font-roboto font-normal text-md text-typography-300 pr-8">
        {info}
      </Text>
    </HStack>
  );
};
