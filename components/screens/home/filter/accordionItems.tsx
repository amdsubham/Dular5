import { useState, useEffect } from "react";
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
import { useFilters } from "@/contexts/FilterContext";

export const accordionItems = [
  {
    key: "who",
    title: "Who you want to date?",
    content: () => {
      const { filters, updateFilters } = useFilters();
      const [value, setValue] = useState<string[]>(filters.interestedIn);

      useEffect(() => {
        setValue(filters.interestedIn);
      }, [filters.interestedIn]);

      const handleChange = (newValue: string[]) => {
        setValue(newValue);
        updateFilters({ interestedIn: newValue });
      };

      return (
        <CheckboxGroup value={value} onChange={handleChange} className="gap-3">
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
      const { filters, updateFilters } = useFilters();
      const [value, setValue] = useState<number[]>([filters.minAge, filters.maxAge]);

      useEffect(() => {
        setValue([filters.minAge, filters.maxAge]);
      }, [filters.minAge, filters.maxAge]);

      const handleChange = (newValue: number[]) => {
        setValue(newValue);
        updateFilters({ minAge: newValue[0], maxAge: newValue[1] });
      };

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
            maxValue={99}
            // @ts-ignore
            onChange={handleChange}
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
      const { filters, updateFilters } = useFilters();
      const [value, setValue] = useState<number>(filters.maxDistance);

      useEffect(() => {
        setValue(filters.maxDistance);
      }, [filters.maxDistance]);

      const handleChange = (newValue: number) => {
        setValue(newValue);
        updateFilters({ maxDistance: newValue });
      };

      return (
        <VStack space="xl" className="pb-1">
          <HStack space="md" className="items-center">
            <Text className="text-typography-950 bg-background-200 rounded-lg px-5 py-2">
              {Math.round(value)} km away
            </Text>
          </HStack>

          <RNSlider
            style={{
              width: "100%",
            }}
            minimumValue={1}
            value={value}
            maximumValue={500}
            onValueChange={handleChange}
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
      const { filters, updateFilters } = useFilters();
      const [value, setValue] = useState<string[]>(filters.lookingFor);

      useEffect(() => {
        setValue(filters.lookingFor);
      }, [filters.lookingFor]);

      const handleChange = (newValue: string[]) => {
        setValue(newValue);
        updateFilters({ lookingFor: newValue });
      };

      return (
        <CheckboxGroup value={value} onChange={handleChange} className="gap-3">
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
