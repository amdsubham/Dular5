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
    key: "gender",
    title: "Who you want to date?",
    content: () => {
      const { filters, updateFilters } = useFilters();
      const [value, setValue] = useState<string[]>(filters.interestedIn);

      useEffect(() => {
        console.log('🎯 Filter Accordion - interestedIn changed:', filters.interestedIn);
        console.log('🎯 Filter Accordion - Setting local value to:', filters.interestedIn);
        setValue(filters.interestedIn);
      }, [filters.interestedIn]);

      console.log('🎯 Filter Accordion - Current local value:', value);
      console.log('🎯 Filter Accordion - Current filters.interestedIn:', filters.interestedIn);

      const handleChange = (newValue: string[]) => {
        // Ensure at least one gender is selected
        if (newValue.length === 0) {
          console.warn('⚠️ Cannot unselect all genders - at least one must be selected');
          return; // Don't allow empty selection
        }
        setValue(newValue);
        updateFilters({ interestedIn: newValue });
      };

      return (
        <CheckboxGroup value={value} onChange={handleChange} className="gap-3">
          <Checkbox value="Man" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Men</CheckboxLabel>
          </Checkbox>
          <Checkbox value="Woman" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Women</CheckboxLabel>
          </Checkbox>
          <Checkbox value="Nonbinary" size="md">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Other</CheckboxLabel>
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
          <Checkbox value="casual-dates">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Casual Dates</CheckboxLabel>
          </Checkbox>
          <Checkbox value="long-term-relationship">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Long term Relationship</CheckboxLabel>
          </Checkbox>
          <Checkbox value="lets-see">
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>Lets see</CheckboxLabel>
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
