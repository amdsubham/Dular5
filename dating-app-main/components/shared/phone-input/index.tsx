import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectItem,
  SelectDragIndicatorWrapper,
  SelectIcon,
} from "@/components/ui/select";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { ChevronDownIcon } from "@/components/ui/icon";

// Country codes data
const countryCodes = [
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "India" },
  { code: "+61", country: "Australia" },
  { code: "+86", country: "China" },
];

interface PhoneInputProps {
  onPhoneChange: (phone: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const PhoneInput = ({
  onPhoneChange,
  onValidationChange,
}: PhoneInputProps) => {
  const [selectedCode, setSelectedCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^\d{10}$/;
    const isValid = phoneRegex.test(number);

    if (!isValid && number.length > 0) {
      setError("Please enter a valid 10-digit phone number");
    } else {
      setError("");
    }

    onValidationChange(isValid);
    return isValid;
  };

  const handlePhoneChange = (value: string) => {
    const cleanNumber = value.replace(/\D/g, "");
    setPhoneNumber(cleanNumber);
    // validatePhoneNumber(cleanNumber);
    if (cleanNumber.length === 10) {
      onPhoneChange(`${selectedCode}${cleanNumber}`);
    }
  };

  return (
    <FormControl isInvalid={!!error}>
      <HStack className="w-[100%] gap-[8px]">
        <Select
          className="w-[22%]"
          selectedValue={selectedCode}
          onValueChange={(value) => setSelectedCode(value)}
        >
          <SelectTrigger variant="outline" size="lg" className="rounded-lg">
            <SelectInput placeholder="_ _" className="py-0" />
            <SelectIcon
              className="mr-3 absolute right-0"
              as={ChevronDownIcon}
            />
          </SelectTrigger>
          <SelectPortal className="pb-6">
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              {countryCodes.map((country) => (
                <SelectItem
                  key={country.code}
                  label={country.code}
                  value={country.code}
                />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>

        <Input
          className="w-[76%] rounded-lg"
          isRequired
          variant="outline"
          size="lg"
        >
          <InputField
            placeholder="Enter phone number"
            keyboardType="number-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            maxLength={10}
            returnKeyType="default"
            // autoFocus={false}
            // onEndEditing={() => Keyboard.dismiss()}
          />
        </Input>
      </HStack>

      {error && (
        <FormControlError>
          <FormControlErrorText>{error}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
};
