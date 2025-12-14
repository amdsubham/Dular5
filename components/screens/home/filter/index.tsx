import React from "react";
import {
  BottomSheet,
  BottomSheetBackdrop,
  BottomSheetContent,
  BottomSheetDragIndicator,
} from "@/components/shared/bottom-sheet";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionTitleText,
  AccordionItem,
  AccordionTrigger,
  AccordionIcon,
} from "@/components/ui/accordion";
import { Button, ButtonText } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { ScrollView } from "react-native-gesture-handler";
import { accordionItems } from "./accordionItems";

export const FilterBottomSheet = ({
  isOpen,
  setIsOpen,
  defaultOpen = undefined,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  defaultOpen?: string[];
}) => {
  return (
    <BottomSheet
      snapPoints={["70%"]}
      enableDynamicSizing={false}
      overDragResistanceFactor={0}
      isOpen={isOpen}
      enableContentPanningGesture={false}
      onClose={() => {
        setIsOpen(false);
      }}
      backgroundStyle={{
        backgroundColor: "black",
      }}
      backdropComponent={BottomSheetBackdrop}
      handleComponent={() => {
        return (
          <BottomSheetDragIndicator
            className="border-0 bg-background-0"
            indicatorStyle={{
              backgroundColor: "white",
              width: 64,
              height: 4,
              marginTop: 10,
            }}
          />
        );
      }}
    >
      <BottomSheetContent className="border-0 bg-background-0 flex flex-col h-full">
        <Text className="text-typography-950 font-semibold text-lg px-3 pt-3">
          Filter
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
        >
          <Accordion
            size="md"
            variant="filled"
            type="multiple"
            isCollapsible={true}
            className="bg-transparent gap-3"
            defaultValue={defaultOpen}
          >
            {accordionItems.map((item) => {
              const FormComponent = item.content;
              return (
                <AccordionItem
                  value={item.key}
                  key={item.key}
                  className="bg-background-50 rounded-lg"
                >
                  <AccordionHeader>
                    <AccordionTrigger>
                      {({ isExpanded }) => (
                        <>
                          <AccordionTitleText className="text-[18px]">
                            {item.title}
                          </AccordionTitleText>
                          <AccordionIcon
                            as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                            className="ml-3"
                          />
                        </>
                      )}
                    </AccordionTrigger>
                  </AccordionHeader>
                  <AccordionContent>
                    <FormComponent />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollView>
        <Button
          size="lg"
          className="w-full mx-3 mb-3"
          style={{ width: 'calc(100% - 24px)' }}
          onPress={() => {
            setIsOpen(false);
          }}
        >
          <ButtonText className="text-typography-950 data-[active=true]:text-typography-900">
            Apply Filter
          </ButtonText>
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
};
