import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { ChevronLeftIcon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";
import { ScrollView } from "@/components/ui/scroll-view";
import { ProfileScreen } from "@/components/screens/profile";
import { ButtonGroup, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { EditScreen } from "@/components/screens/profile/edit";
import { getUserProfile } from "@/services/profile";
import { getCurrentUser } from "@/services/auth";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useWindowDimensions } from "react-native";
const AnimatedBox = Animated.createAnimatedComponent(Box);

const Header = ({ userName }: { userName: string }) => {
  const router = useRouter();

  const handleDone = () => {
    router.back();
  };
  return (
    <Box className="w-full flex flex-row items-center py-3 gap-2 justify-between">
      <Button variant="link" className="px-4" onPress={handleDone}>
        <ButtonIcon
          as={ChevronLeftIcon}
          className="text-typography-950 h-6 w-6"
        />
      </Button>
      <Heading size="lg" className="font-satoshi font-medium">
        {userName}
      </Heading>
      <Button
        variant="link"
        className="bg-transparent px-4"
        size="sm"
        onPress={handleDone}
      >
        <ButtonText className="font-roboto data-[active=true]:no-underline">
          Done
        </ButtonText>
      </Button>
    </Box>
  );
};

export default function EditProfile() {
  const translateX = useSharedValue(0);
  const { width } = useWindowDimensions();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  const router = useRouter();

  const [userName, setUserName] = useState("Profile");
  const [activeTab, setActiveTab] = useState<"Edit" | "Preview">("Edit");
  const isEditing = activeTab === "Edit";

  useEffect(() => {
    const loadUserName = async () => {
      const profile = await getUserProfile();
      if (profile?.firstName) {
        setUserName(profile.firstName);
      }
    };
    loadUserName();
  }, []);

  return (
    <Box className="flex-1">
      <Header userName={userName} />
      <ButtonGroup className="w-full flex flex-row px-4 mt-6" isAttached>
        <Button
          onPress={() => {
            translateX.value = withTiming(0, { duration: 300 });
            setActiveTab("Edit");
          }}
          className="flex-1 bg-transparent  rounded-none data-[active=true]:bg-transparent"
        >
          <ButtonText className="text-typography-950 data-[active=true]:text-typography-950">
            Edit
          </ButtonText>
        </Button>
        <Button
          onPress={() => {
            translateX.value = withTiming(width / 2, { duration: 300 });
            setActiveTab("Preview");
          }}
          className="flex-1 bg-transparent rounded-none data-[active=true]:bg-transparent"
        >
          <ButtonText className="text-typography-950 data-[active=true]:text-typography-950">
            Preview
          </ButtonText>
        </Button>
      </ButtonGroup>
      <AnimatedBox
        style={animatedStyle}
        className="w-1/2 border-b-2 border-primary-500 mb-6"
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {isEditing ? <EditScreen /> : <ProfileScreen />}
      </ScrollView>
    </Box>
  );
}
