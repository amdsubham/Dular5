/**
 * Subscription Plans Page
 *
 * Displays available subscription plans and allows users to upgrade.
 * Shows current plan status and swipe usage.
 */

import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { getSubscriptionPlans } from "@/services/subscription";
import { PaymentModal } from "@/components/screens/subscription/payment-modal/instamojo";
import { SubscriptionPlan, formatPrice, getPlanDurationText } from "@/types/subscription";
import Animated, { FadeInDown } from "react-native-reanimated";
import { auth, db } from "@/config/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const AnimatedBox = Animated.createAnimatedComponent(Box);

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    subscription,
    isPremium,
    swipesRemaining,
    swipesUsedToday,
    swipesLimit,
    daysRemaining,
    refreshSubscription,
  } = useSubscription();

  // Update lastActive timestamp when page loads
  useEffect(() => {
    const updateLastActive = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await updateDoc(doc(db, "users", currentUser.uid), {
            lastActive: serverTimestamp(),
          });
          console.log("✅ Updated lastActive timestamp");
        } catch (error) {
          console.error("❌ Error updating lastActive:", error);
        }
      }
    };

    updateLastActive();
  }, []);

  // Load subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);

        const plansData = await getSubscriptionPlans();

        // Show error if no plans are available
        if (plansData.length === 0) {
          Alert.alert(
            "Plans Not Available",
            "Subscription plans haven't been set up yet. Please contact support or check back later.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        }

        setPlans(plansData);
      } catch (error) {
        console.error("Error loading plans:", error);
        Alert.alert(
          "Error Loading Plans",
          "Unable to load subscription plans. Please try again later.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Check if user is already on this plan
    if (subscription?.currentPlan === plan.id) {
      Alert.alert(
        "Already Subscribed",
        `You're already on the ${plan.displayName}. Your subscription is active.`,
        [{ text: "OK" }]
      );
      return;
    }

    // Open payment modal
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    console.log("✅ handlePaymentSuccess called");
    setShowPaymentModal(false);
    setSelectedPlan(null);

    // Refresh subscription data to ensure UI updates
    console.log("🔄 Refreshing subscription data after successful payment...");
    await refreshSubscription();
    console.log("✅ Subscription data refreshed");

    // Show success message
    Alert.alert(
      "Payment Successful! 🎉",
      "Your subscription has been activated. Enjoy unlimited swipes!",
      [
        {
          text: "Great!",
          onPress: () => {
            // Optionally navigate back or refresh
            router.back();
          },
        },
      ]
    );
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentModal(false);

    // Show error message
    Alert.alert(
      "Payment Failed",
      error || "Something went wrong. Please try again.",
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <Box className="flex-1 bg-background-0 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="text-typography-500 mt-4">Loading plans...</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#FF6B9D", "#C239B3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24, paddingTop: 60 }}
        >
          <VStack className="gap-4">
            <Heading size="3xl" className="text-white font-satoshi">
              Choose Your Plan
            </Heading>
            <Text className="text-white/90 text-base leading-6">
              Upgrade to premium and get more swipes, better matches, and exclusive features!
            </Text>
          </VStack>
        </LinearGradient>

        <VStack className="px-4 gap-6 mt-6">
          {/* Current Plan Status */}
          {subscription && (
            <AnimatedBox
              className="bg-background-50 rounded-2xl p-6 border border-background-100"
              entering={FadeInDown.duration(400)}
            >
              <VStack className="gap-4">
                <HStack className="justify-between items-center">
                  <VStack>
                    <Text className="text-typography-500 text-sm font-roboto">
                      Current Plan
                    </Text>
                    <Heading size="xl" className="text-typography-950 font-satoshi mt-1">
                      {subscription.currentPlan.charAt(0).toUpperCase() + subscription.currentPlan.slice(1)}
                    </Heading>
                  </VStack>
                  <Box className="bg-primary-100 px-4 py-2 rounded-full">
                    <Text className="text-primary-600 font-semibold">
                      {isPremium ? "Premium" : "Free"}
                    </Text>
                  </Box>
                </HStack>

                {/* Swipe Usage */}
                <VStack className="gap-2">
                  <HStack className="justify-between items-center">
                    <Text className="text-typography-600 text-sm font-roboto">
                      Swipes Today
                    </Text>
                    <Text className="text-typography-900 text-sm font-bold font-roboto">
                      {swipesUsedToday} / {swipesLimit}
                    </Text>
                  </HStack>
                  <Box className="h-2 bg-background-200 rounded-full overflow-hidden">
                    <Box
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: `${(swipesUsedToday / swipesLimit) * 100}%`,
                      }}
                    />
                  </Box>
                  <Text className="text-typography-500 text-xs font-roboto">
                    {swipesRemaining} swipes remaining today
                  </Text>
                </VStack>

                {/* Days Remaining (for premium users) */}
                {isPremium && daysRemaining > 0 && (
                  <Box className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-3">
                    <HStack className="items-center gap-2">
                      <Text className="text-2xl">⏱️</Text>
                      <Text className="text-typography-700 text-sm font-roboto">
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining in your subscription
                      </Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </AnimatedBox>
          )}

          {/* Available Plans */}
          <VStack className="gap-4">
            <Heading size="xl" className="text-typography-950 font-satoshi">
              Available Plans
            </Heading>

            {plans.map((plan, index) => (
              <AnimatedBox
                key={plan.id}
                entering={FadeInDown.duration(400).delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.7}
                >
                  <Box
                    className={`rounded-2xl p-6 border-2 ${
                      plan.popular
                        ? "border-primary-500 bg-gradient-to-b from-primary-50 to-white"
                        : "border-background-100 bg-background-50"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <Box className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 px-4 py-1.5 rounded-full shadow-lg">
                        <Text className="text-white text-xs font-bold font-roboto">
                          🔥 MOST POPULAR
                        </Text>
                      </Box>
                    )}

                    <VStack className="gap-4">
                      {/* Plan Header */}
                      <VStack className="gap-1">
                        <Heading size="2xl" className="text-typography-950 font-satoshi">
                          {plan.displayName}
                        </Heading>
                        <Text className="text-typography-600 text-sm font-roboto">
                          {plan.description}
                        </Text>
                      </VStack>

                      {/* Price */}
                      <HStack className="items-end gap-2">
                        <Heading size="4xl" className="text-primary-600 font-satoshi">
                          {formatPrice(plan.price)}
                        </Heading>
                        <Text className="text-typography-600 text-base font-roboto mb-2">
                          / {getPlanDurationText(plan.duration)}
                        </Text>
                      </HStack>

                      {/* Features */}
                      <VStack className="gap-3 mt-2">
                        {plan.features.map((feature, idx) => (
                          <HStack key={idx} className="items-start gap-3">
                            <Box className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center mt-0.5">
                              <Text className="text-primary-600 text-sm">✓</Text>
                            </Box>
                            <Text className="text-typography-700 text-sm font-roboto flex-1">
                              {feature}
                            </Text>
                          </HStack>
                        ))}

                        {/* Swipe Limit */}
                        <HStack className="items-start gap-3">
                          <Box className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center mt-0.5">
                            <Text className="text-primary-600 text-sm">✓</Text>
                          </Box>
                          <Text className="text-typography-700 text-sm font-roboto flex-1">
                            {plan.swipeLimit === -1 ? "Unlimited" : plan.swipeLimit} daily swipes
                          </Text>
                        </HStack>
                      </VStack>

                      {/* Select Button */}
                      <Button
                        className={`mt-4 ${
                          plan.popular
                            ? "bg-primary-500 data-[active=true]:bg-primary-600"
                            : "bg-background-900 data-[active=true]:bg-background-700"
                        }`}
                        size="lg"
                        onPress={() => handleSelectPlan(plan)}
                      >
                        <ButtonText className="font-semibold font-roboto">
                          {subscription?.currentPlan === plan.id ? "Current Plan" : "Select Plan"}
                        </ButtonText>
                      </Button>
                    </VStack>
                  </Box>
                </TouchableOpacity>
              </AnimatedBox>
            ))}
          </VStack>

          {/* Benefits Section */}
          <AnimatedBox
            className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100"
            entering={FadeInDown.duration(400).delay(400)}
          >
            <VStack className="gap-4">
              <Heading size="lg" className="text-typography-950 font-satoshi">
                Why Go Premium?
              </Heading>

              {[
                { icon: "💝", title: "More Matches", desc: "Get more daily swipes to find your perfect match" },
                { icon: "🚀", title: "Priority Matching", desc: "Your profile appears first in others' feed" },
                { icon: "✨", title: "Exclusive Features", desc: "Access special badges and profile boosters" },
                { icon: "📊", title: "Advanced Analytics", desc: "See who viewed your profile" },
              ].map((benefit, index) => (
                <HStack key={index} className="items-start gap-4">
                  <Box className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm">
                    <Text className="text-2xl">{benefit.icon}</Text>
                  </Box>
                  <VStack className="flex-1">
                    <Text className="text-typography-900 text-base font-semibold font-roboto">
                      {benefit.title}
                    </Text>
                    <Text className="text-typography-600 text-sm font-roboto">
                      {benefit.desc}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </AnimatedBox>

          {/* FAQ or Support Link */}
          <Box className="items-center">
            <Text className="text-typography-500 text-sm text-center font-roboto">
              Have questions? Contact our support team
            </Text>
          </Box>
        </VStack>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        plan={selectedPlan}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlan(null);
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </Box>
  );
}
