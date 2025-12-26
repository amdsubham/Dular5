import { Icon } from "@/components/ui/icon";

import { Box } from "@/components/ui/box";
import { LocationIcon, LoveBadgeIcon } from "../icons";
import { Text } from "@/components/ui/text";

export const LoveBadge = ({
  lovePercentage,
  size = "sm",
}: {
  lovePercentage: number;
  size?: "sm" | "lg";
}) => {
  return (
    <Box className="bg-[#79C353] flex flex-row items-center justify-center gap-x-1 rounded-full px-2 py-1">
      <Icon
        as={LoveBadgeIcon}
        className={size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5"}
      />
      <Text
        size={size === "lg" ? "sm" : "xs"}
        className={`font-roboto text-[#417D22] ${
          size === "lg" ? "" : "text-[10px]"
        }`}
      >
        {lovePercentage}%
      </Text>
    </Box>
  );
};

export const LocationBadge = ({
  distance,
  size = "sm",
}: {
  distance: number | string;
  size?: "sm" | "lg";
}) => {
  // Format distance to always show 2-3 digits by removing the last digit
  const formatDistance = (dist: number | string): number => {
    const numDist = typeof dist === "string" ? parseFloat(dist) : dist;
    // Divide by 10 and round to get 2-3 digit number
    return Math.round(numDist / 10);
  };

  const formattedDistance = formatDistance(distance);

  return (
    <Box className="border border-[#D5D4D466] rounded-full flex flex-row items-center justify-center gap-x-1 px-2 py-1">
      <Icon as={LocationIcon} className="w-2.5 h-2.5 text-typography-700" />
      <Text
        size={size === "lg" ? "sm" : "xs"}
        className={`font-roboto text-[10px] text-typography-700 ${
          size === "lg" ? "text-sm" : ""
        }`}
      >
        {formattedDistance} km away
      </Text>
    </Box>
  );
};
