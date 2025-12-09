import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { LogoIcon, HelpCenterIcon } from "@/components/shared/icons";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import {
  ChevronRightIcon,
  Icon,
  SettingsIcon,
  EditIcon,
} from "@/components/ui/icon";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Alert } from "react-native";
import { getUserProfile, calculateAge } from "@/services/profile";
import { signOut } from "@/services/auth";
import { LogOut } from "lucide-react-native";

function Header() {
  return (
    <Box className="w-full flex flex-row items-center p-4 gap-2">
      <Icon as={LogoIcon} className="w-7 h-7" />
      <Heading size="xl" className="font-satoshi">
        Dular
      </Heading>
    </Box>
  );
}

function ProfileCard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <Box className="bg-background-50 rounded-2xl p-5 mt-6">
        <Box className="flex-row gap-4 items-center">
          <Box className="w-24 h-24 rounded-full bg-background-200" />
          <Box className="flex-1 gap-2">
            <Box className="h-6 w-32 bg-background-200 rounded" />
            <Box className="h-4 w-24 bg-background-200 rounded" />
          </Box>
        </Box>
      </Box>
    );
  }

  const fullName = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "";
  const age = profile?.dob ? calculateAge(profile.dob) : null;
  const displayName = age ? `${fullName || "User"}, ${age}` : fullName || "User";
  const mainProfilePicture = profile?.pictures?.[0] || null;

  return (
    <Box className="bg-background-50 rounded-2xl p-5 mt-6">
      {/* Profile Header with Image and Name */}
      <Box className="flex-row gap-4 items-center">
        {mainProfilePicture ? (
          <Image
            source={{ uri: mainProfilePicture }}
            className="w-24 h-24 rounded-full"
            alt="profile"
          />
        ) : (
          <Image
            source={require(`@/assets/images/common/profile_avatar.png`)}
            className="w-24 h-24 rounded-full"
            alt="profile"
          />
        )}
        <Box className="flex-1 gap-2">
          <Heading size="xl" className="font-roboto font-semibold text-typography-950">
            {displayName}
          </Heading>
          <Button
            size="sm"
            variant="outline"
            className="self-start border-background-300"
            onPress={() => router.push("/edit-profile")}
          >
            <ButtonIcon as={EditIcon} className="text-typography-700 mr-1" size="xs" />
            <ButtonText className="text-typography-950 font-roboto text-sm">
              Edit Profile
            </ButtonText>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function ProfileOptions() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(auth)");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <Box className="flex-col gap-y-2 mt-6 py-2">
      <Pressable
        className="flex-row gap-x-3 items-center w-full data-[active=true]:bg-background-50/50 rounded-lg py-3 px-2"
        onPress={() => router.push("/settings")}
      >
        <Box className="bg-background-50 rounded-lg h-9 w-9 flex items-center justify-center">
          <Icon as={SettingsIcon} className="w-5 h-5 text-typography-700" />
        </Box>
        <Text className="font-roboto text-typography-950 font-medium flex-1 text-base">
          Settings
        </Text>
        <Icon as={ChevronRightIcon} className="w-5 h-5 text-typography-500" />
      </Pressable>

      <Pressable
        className="flex-row gap-x-3 items-center w-full data-[active=true]:bg-background-50/50 rounded-lg py-3 px-2"
        onPress={() => router.push("/help-center")}
      >
        <Box className="bg-background-50 rounded-lg h-9 w-9 flex items-center justify-center">
          <Icon as={HelpCenterIcon} className="w-5 h-5 text-typography-700" />
        </Box>
        <Text className="font-roboto text-typography-950 font-medium flex-1 text-base">
          Help Center
        </Text>
        <Icon as={ChevronRightIcon} className="w-5 h-5 text-typography-500" />
      </Pressable>

      <Pressable
        className="flex-row gap-x-3 items-center w-full data-[active=true]:bg-background-50/50 rounded-lg py-3 px-2"
        onPress={handleLogout}
      >
        <Box className="bg-background-50 rounded-lg h-9 w-9 flex items-center justify-center">
          <Icon as={LogOut} className="w-5 h-5 text-typography-700" />
        </Box>
        <Text className="font-roboto text-typography-950 font-medium flex-1 text-base">
          Logout
        </Text>
        <Icon as={ChevronRightIcon} className="w-5 h-5 text-typography-500" />
      </Pressable>
    </Box>
  );
}

export default function Index() {
  return (
    <Box className="flex-1 bg-background-0">
      <Header />
      <Box className="px-4 flex-1">
        <ProfileCard />
        <ProfileOptions />
      </Box>
    </Box>
  );
}
