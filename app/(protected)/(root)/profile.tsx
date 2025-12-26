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
import { Alert, TouchableOpacity, ScrollView } from "react-native";
import { getUserProfile, calculateAge } from "@/services/profile";
import { signOut } from "@/services/auth";
import { LogOut, Crown, Sparkles, Zap } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSubscription } from "@/hooks/useSubscription";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";

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
  const { isPremium, subscription } = useSubscription();

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
  const planDisplayName = subscription?.planName || subscription?.currentPlan?.toUpperCase() || "Premium";

  return (
    <Box className="bg-background-50 rounded-2xl p-5 mt-6">
      {/* Profile Header with Image and Name */}
      <Box className="flex-row gap-4 items-center">
        <Box className="relative">
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
          {/* Premium Badge on Avatar */}
          {isPremium && (
            <Box className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-1.5 border-2 border-background-0">
              <Icon as={Crown} className="w-4 h-4 text-white" />
            </Box>
          )}
        </Box>
        <Box className="flex-1 gap-2">
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              <Heading size="xl" className="font-roboto font-semibold text-typography-950">
                {displayName}
              </Heading>
              {isPremium && (
                <Box className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold font-roboto">
                    {planDisplayName}
                  </Text>
                </Box>
              )}
            </HStack>
          </VStack>
          <Button
            size="sm"
            variant="outline"
            className="self-start border-background-300"
            onPress={() => router.push("/(protected)/edit-profile")}
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

function ActiveSubscriptionCard() {
  const router = useRouter();
  const { subscription, swipesRemaining, daysRemaining, swipesLimit, subscriptionEnabled } = useSubscription();

  // Hide subscription cards when feature is disabled
  if (!subscriptionEnabled) return null;
  if (!subscription) return null;

  const currentPlan = subscription.currentPlan || "daily";
  const planDisplayName = currentPlan === "daily"
    ? "Daily Plan"
    : currentPlan === "weekly"
    ? "Weekly Plan"
    : currentPlan === "monthly"
    ? "Monthly Plan"
    : subscription.planName || currentPlan.toUpperCase();

  // Always show Monthly Plan as upgrade option (unless user is already on monthly)
  const nextPlan = currentPlan !== "monthly"
    ? {
        name: "Monthly Plan",
        price: "₹500",
        savings: "Best Value",
        features: ["Unlimited swipes", "Priority matching", "See all likes"]
      }
    : null;

  // Get plan-specific swipes limit
  const swipesText = currentPlan === "monthly"
    ? "Unlimited swipes"
    : swipesLimit === 999999
    ? "Unlimited swipes"
    : `${swipesLimit} swipes per day`;

  return (
    <VStack className="mt-6 mb-4 gap-4">
      {/* Current Active Plan Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(protected)/subscription")}
      >
        <LinearGradient
          colors={["#4CAF50", "#2E7D32", "#1B5E20"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20 }}
        >
          <VStack className="gap-4">
            {/* Header with Crown Icon */}
            <HStack className="items-center justify-between">
              <HStack className="items-center gap-3">
                <Box className="bg-white/20 rounded-full p-3">
                  <Icon as={Crown} className="w-7 h-7 text-yellow-300" />
                </Box>
                <VStack className="gap-1">
                  <Heading size="xl" className="text-white font-satoshi font-bold">
                    {planDisplayName} Active
                  </Heading>
                  <Text className="text-white/90 text-sm font-roboto">
                    {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Enjoy your benefits"}
                  </Text>
                </VStack>
              </HStack>
              <Icon as={Sparkles} className="w-6 h-6 text-yellow-300" />
            </HStack>

            {/* Active Features */}
            <VStack className="gap-2.5">
              <HStack className="items-center gap-2">
                <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                  <Text className="text-yellow-300 text-xs font-bold">✓</Text>
                </Box>
                <Text className="text-white text-sm font-roboto">
                  {swipesText}
                </Text>
              </HStack>
              <HStack className="items-center gap-2">
                <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                  <Text className="text-yellow-300 text-xs font-bold">✓</Text>
                </Box>
                <Text className="text-white text-sm font-roboto">
                  See who likes you
                </Text>
              </HStack>
              <HStack className="items-center gap-2">
                <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                  <Text className="text-yellow-300 text-xs font-bold">✓</Text>
                </Box>
                <Text className="text-white text-sm font-roboto">
                  Priority matching & profile boost
                </Text>
              </HStack>
            </VStack>

            {/* Swipe Status */}
            <Box className="bg-white/15 rounded-xl p-3 border border-white/20">
              <HStack className="items-center justify-between">
                <VStack className="gap-1">
                  <Text className="text-white/80 text-xs font-roboto">
                    Today's Swipes
                  </Text>
                  <Text className="text-white font-bold text-lg font-roboto">
                    {swipesRemaining === 999999 ? "Unlimited" : `${swipesRemaining} remaining`}
                  </Text>
                </VStack>
                <Icon as={Zap} className="w-8 h-8 text-yellow-300" />
              </HStack>
            </Box>

            {/* Manage Button */}
            <Box className="bg-white/10 rounded-xl py-3 items-center border border-white/20">
              <Text className="text-white font-semibold text-sm font-roboto">
                Tap to Manage Subscription
              </Text>
            </Box>
          </VStack>
        </LinearGradient>
      </TouchableOpacity>

      {/* Upgrade to Monthly Plan Card (only if not on monthly) */}
      {nextPlan && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(protected)/subscription")}
        >
          <LinearGradient
            colors={["#FF6B9D", "#C239B3", "#8B3A9F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <VStack className="gap-4">
              {/* Header */}
              <HStack className="items-center justify-between">
                <VStack className="gap-1 flex-1">
                  <Heading size="xl" className="text-white font-satoshi font-bold">
                    Upgrade to {nextPlan.name}
                  </Heading>
                  <Text className="text-white/90 text-sm font-roboto">
                    {nextPlan.savings} • {nextPlan.price}/month
                  </Text>
                </VStack>
                <Box className="bg-white/20 rounded-full p-3">
                  <Icon as={Crown} className="w-6 h-6 text-yellow-300" />
                </Box>
              </HStack>

              {/* Features */}
              <VStack className="gap-2.5">
                {nextPlan.features.map((feature, index) => (
                  <HStack key={index} className="items-center gap-2">
                    <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                      <Text className="text-yellow-300 text-xs font-bold">✓</Text>
                    </Box>
                    <Text className="text-white text-sm font-roboto">
                      {feature}
                    </Text>
                  </HStack>
                ))}
              </VStack>

              {/* Upgrade Button */}
              <Box className="bg-white/10 rounded-xl py-3 items-center border border-white/20">
                <Text className="text-white font-semibold text-sm font-roboto">
                  Tap to Upgrade Now →
                </Text>
              </Box>
            </VStack>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </VStack>
  );
}

function PremiumUpgradeCard() {
  const router = useRouter();
  const { isPremium, subscription, swipesRemaining, swipesLimit, loading, subscriptionEnabled } = useSubscription();

  // Debug: Log subscription status
  console.log("🔍 PremiumUpgradeCard - Subscription Status:", {
    loading,
    isPremium,
    subscription: subscription ? {
      currentPlan: subscription.currentPlan,
      planName: subscription.planName,
      isActive: subscription.isActive,
      isPremium: subscription.isPremium,
    } : null,
    swipesLimit,
    swipesRemaining,
    subscriptionEnabled,
  });

  // Hide upgrade card when subscriptions are disabled
  if (!subscriptionEnabled) return null;

  // Show nothing while loading
  if (loading) {
    console.log("⏳ Loading subscription data...");
    return null;
  }

  // Show active subscription card if premium
  if (isPremium) {
    console.log("✅ User is premium - showing active subscription card");
    return <ActiveSubscriptionCard />;
  }

  console.log("📢 User is FREE - showing upgrade card");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push("/subscription")}
      className="mt-6 mb-4"
    >
      <LinearGradient
        colors={["#FF6B9D", "#C239B3", "#8B3A9F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20 }}
      >
        <VStack className="gap-4">
          {/* Header with Icon */}
          <HStack className="items-center justify-between">
            <HStack className="items-center gap-3">
              <Box className="bg-white/20 rounded-full p-3">
                <Icon as={Crown} className="w-7 h-7 text-white" />
              </Box>
              <VStack className="gap-1">
                <Heading size="xl" className="text-white font-satoshi font-bold">
                  Go Premium
                </Heading>
                <Text className="text-white/90 text-sm font-roboto">
                  Unlock unlimited features
                </Text>
              </VStack>
            </HStack>
            <Icon as={Sparkles} className="w-6 h-6 text-yellow-300" />
          </HStack>

          {/* Features */}
          <VStack className="gap-2.5">
            <HStack className="items-center gap-2">
              <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                <Icon as={Zap} className="w-3 h-3 text-yellow-300" />
              </Box>
              <Text className="text-white text-sm font-roboto">
                Unlimited daily swipes
              </Text>
            </HStack>
            <HStack className="items-center gap-2">
              <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                <Icon as={Zap} className="w-3 h-3 text-yellow-300" />
              </Box>
              <Text className="text-white text-sm font-roboto">
                See who likes you
              </Text>
            </HStack>
            <HStack className="items-center gap-2">
              <Box className="w-5 h-5 rounded-full bg-white/25 items-center justify-center">
                <Icon as={Zap} className="w-3 h-3 text-yellow-300" />
              </Box>
              <Text className="text-white text-sm font-roboto">
                Priority matching & profile boost
              </Text>
            </HStack>
          </VStack>

          {/* Swipe Status */}
          <Box className="bg-white/15 rounded-xl p-3 border border-white/20">
            <HStack className="items-center justify-between mb-2">
              <Text className="text-white/80 text-xs font-roboto">
                Today's Swipes
              </Text>
              <Text className="text-white font-bold text-xs font-roboto">
                {swipesRemaining} / {swipesLimit}
              </Text>
            </HStack>
            <Box className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <Box
                className="h-full bg-white rounded-full"
                style={{
                  width: `${((swipesLimit - swipesRemaining) / swipesLimit) * 100}%`,
                }}
              />
            </Box>
          </Box>

          {/* CTA Button */}
          <Box className="bg-white rounded-xl py-3.5 items-center">
            <Text className="text-primary-600 font-bold text-base font-roboto">
              Upgrade Now - Starting ₹30
            </Text>
          </Box>
        </VStack>
      </LinearGradient>
    </TouchableOpacity>
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
        onPress={() => router.push("/(protected)/settings")}
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
        onPress={() => router.push("/(protected)/help-center")}
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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        <ProfileCard />
        <PremiumUpgradeCard />
        <ProfileOptions />
      </ScrollView>
    </Box>
  );
}
