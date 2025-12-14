import { useState } from "react";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderLeftThumb,
  RangeSliderRightThumb,
  RangeSliderTrack,
} from "@/components/shared/range-slider";
import { default as RNSlider } from "@react-native-community/slider";

export const accordionItems = [
  {
    key: "who",
    title: "Who you want to date?",
    content: () => {
      const [value, setValue] = useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onChange={setValue} className="gap-3">
          <Checkbox value="men" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Men</CheckboxLabel>
          </Checkbox>
          <Checkbox value="women" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Women</CheckboxLabel>
          </Checkbox>
          <Checkbox value="non-binary" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Non binary</CheckboxLabel>
          </Checkbox>
        </CheckboxGroup>
      );
    },
  },
  {
    key: "age",
    title: "Age",
    content: () => {
      const [value, setValue] = useState<number[]>([18, 26]);
      return (
        <VStack space="xl" className="pb-1">
          <HStack space="md" className="items-center">
            <Text className="text-typography-950 rounded-lg bg-background-200 px-5 py-2">
              {value[0]}
            </Text>
            <Box className="bg-background-200 w-3.5 h-[1px] rounded-full" />
            <Text className="text-typography-950 rounded-lg bg-background-200 px-5 py-2">
              {value[1]}
            </Text>
          </HStack>

          <RangeSlider
            size="md"
            orientation="horizontal"
            // @ts-ignore
            value={value}
            minValue={18}
            maxValue={62}
            // @ts-ignore
            onChange={(value: number[]) => {
              setValue(value);
            }}
          >
            <RangeSliderTrack>
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderRightThumb />
            <RangeSliderLeftThumb />
          </RangeSlider>
        </VStack>
      );
    },
  },
  {
    key: "distance",
    title: "Distance",
    content: () => {
      const [value, setValue] = useState<number>(160);
      return (
        <VStack space="xl" className="pb-1">
          <HStack space="md" className="items-center">
            <Text className="text-typography-950 bg-background-200 rounded-lg px-5 py-2">
              {value} km away
            </Text>
          </HStack>

          <RNSlider
            style={{
              width: "100%",
            }}
            minimumValue={0}
            value={250}
            maximumValue={500}
            minimumTrackTintColor="#F472B6"
            maximumTrackTintColor="#535252"
            thumbTintColor="#EC4899"
          />
        </VStack>
      );
    },
  },
  {
    key: "height",
    title: "Height",
    content: () => {
      const [value, setValue] = useState<number>(190);
      return (
        <VStack space="xl" className="pb-1">
          <HStack space="md" className="items-center">
            <Text className="text-typography-950 bg-background-200 rounded-lg px-5 py-2">
              {value} cm
            </Text>
          </HStack>

          <RNSlider
            style={{
              width: "100%",
            }}
            minimumValue={0}
            value={220}
            maximumValue={300}
            minimumTrackTintColor="#F472B6"
            maximumTrackTintColor="#535252"
            thumbTintColor="#EC4899"
          />
        </VStack>
      );
    },
  },
  {
    key: "looking-for",
    title: "Looking for",
    content: () => {
      const [value, setValue] = useState<string[]>([]);
      return (
        <CheckboxGroup value={value} onChange={setValue} className="gap-3">
          <Checkbox value="long-term">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Long term relationship</CheckboxLabel>
          </Checkbox>
          <Checkbox value="short-term">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Fun and casual dates</CheckboxLabel>
          </Checkbox>
          <Checkbox value="no-commitment">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>No commitment</CheckboxLabel>
          </Checkbox>
          <Checkbox value="polygamy">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Polygamy</CheckboxLabel>
          </Checkbox>
          <Checkbox value="marriage">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Marriage</CheckboxLabel>
          </Checkbox>
        </CheckboxGroup>
      );
    },
  },
];
