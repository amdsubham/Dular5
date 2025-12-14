import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { Box } from "@/components/ui/box";
interface OTPComponentProps {
  onComplete: (otp: string) => void;
}
export const OTPComponent = ({ onComplete }: OTPComponentProps) => {
  const [otpValue, setOtpValue] = useState("1234");
  return (
    <Box>
      <OtpInput
        numberOfDigits={4}
        focusColor="#404040"
        focusStickBlinkingDuration={500}
        autoFocus={false}
        blurOnFilled
        type="numeric"
        placeholder="----"
        onTextChange={(text) => setOtpValue(text)}
        onFilled={(text) => {
          onComplete(text);
        }}
        textInputProps={{
          accessibilityLabel: "One-Time Password",
        }}
        theme={{
          containerStyle: styles.container,
          pinCodeContainerStyle: styles.pinCodeContainer,
          pinCodeTextStyle: styles.pinCodeText,
          focusStickStyle: styles.focusStick,
          focusedPinCodeContainerStyle: styles.activePinCodeContainer,
          placeholderTextStyle: styles.placeholderTextStyle,
        }}
      />
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 8,
  },
  pinCodeContainer: {
    borderWidth: 1,
    borderColor: "#747474",
    borderRadius: 4,
    width: 44,
    height: 44,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  pinCodeText: {
    fontSize: 18,
    color: "#F5F5F5",
    fontWeight: "400",
  },
  focusStick: {
    // Add your styles for the focus stick here
  },
  activePinCodeContainer: {
    // Add your styles for the active pin code container here
    borderColor: "#D5D4D4",
  },
  placeholderTextStyle: {
    fontSize: 18,
    color: "#A3A3A3",
    fontWeight: "400",
  },
});
