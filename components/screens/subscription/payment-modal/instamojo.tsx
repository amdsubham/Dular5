/**
 * Payment Modal - Instamojo Smart Links Integration
 *
 * Displays payment summary and opens Instamojo smart link in WebView.
 * Webhook handles payment confirmation automatically.
 */

import React, { useState, useRef } from "react";
import { Modal, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SlideInDown } from "react-native-reanimated";
import {
  SubscriptionPlan,
  formatPrice,
  getPlanDurationText,
} from "@/types/subscription";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

const AnimatedBox = Animated.createAnimatedComponent(Box);

// Instamojo smart link URLs
const INSTAMOJO_LINKS = {
  monthly: "https://imjo.in/qQBgZ7",
  weekly: "https://imjo.in/xU7gCw",
  daily: "https://imjo.in/hbvW2s",
};

interface PaymentModalProps {
  visible: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  plan,
  onClose,
  onSuccess,
  onError,
}) => {
  const [processing, setProcessing] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState("");
  const webViewRef = useRef<WebView>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!plan) return null;

  /**
   * Poll subscription status to check if webhook has activated subscription
   */
  const checkSubscriptionActivation = async (maxAttempts = 10): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    console.log("🔍 Checking subscription activation...");

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const subscriptionDoc = await getDoc(doc(db, "userSubscriptions", currentUser.uid));

        if (subscriptionDoc.exists()) {
          const data = subscriptionDoc.data();
          const isActivePlan = data.currentPlan === plan.id && data.isActive === true;

          console.log(`📊 Attempt ${attempt}/${maxAttempts}: Plan=${data.currentPlan}, Active=${data.isActive}`);

          if (isActivePlan) {
            console.log("✅ Subscription activated!");
            return true;
          }
        }

        // Wait 2 seconds before next check
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error checking subscription (attempt ${attempt}):`, error);
      }
    }

    console.log("⏰ Subscription check timed out");
    return false;
  };

  const handlePayment = () => {
    console.log("💳 Pay button clicked!");

    try {
      setProcessing(true);

      console.log("🚀 Starting Instamojo payment for plan:", plan.id);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Get the smart link URL for the plan
      const smartLinkUrl = INSTAMOJO_LINKS[plan.id as keyof typeof INSTAMOJO_LINKS];

      if (!smartLinkUrl) {
        throw new Error("Smart link not configured for this plan");
      }

      console.log("🔗 Opening smart link in WebView:", smartLinkUrl);

      // Open WebView immediately - webhook will create transaction
      setShowWebView(true);
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      onError(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log("📍 WebView navigation:", url);

    // Check if payment was successful
    // Instamojo redirects to order/status page after payment
    if (url.includes("/order/status/") && !verifyingPayment) {
      console.log("✅ Payment appears successful - verifying with webhook...");
      setVerifyingPayment(true);
      setShowWebView(false);

      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Poll subscription status
      const isActivated = await checkSubscriptionActivation(10); // Check for 20 seconds (10 attempts x 2 seconds)

      setVerifyingPayment(false);

      if (isActivated) {
        console.log("💡 Subscription activated successfully!");
        onSuccess();
      } else {
        console.log("⚠️ Subscription not activated yet");
        Alert.alert(
          "Payment Processing",
          "Your payment was received but subscription activation is taking longer than expected. Please check back in a few moments or contact support if the issue persists.",
          [
            {
              text: "Check Again",
              onPress: async () => {
                setVerifyingPayment(true);
                const retry = await checkSubscriptionActivation(10);
                setVerifyingPayment(false);
                if (retry) {
                  onSuccess();
                } else {
                  onClose();
                }
              },
            },
            {
              text: "Close",
              onPress: () => onClose(),
            },
          ]
        );
      }
    }

    // Check for cancel
    if (url.includes("payment-cancel") || url.includes("cancel")) {
      console.log("❌ Payment cancelled");
      setShowWebView(false);
      onError("Payment was cancelled");
    }
  };

  const gstAmount = (plan.price * 0.18).toFixed(2); // 18% GST
  const totalAmount = (plan.price + parseFloat(gstAmount)).toFixed(2);

  // If WebView is showing, render full-screen WebView
  if (showWebView) {
    const smartLinkUrl = INSTAMOJO_LINKS[plan.id as keyof typeof INSTAMOJO_LINKS];

    return (
      <Modal visible={visible} animationType="slide">
        <Box className="flex-1 bg-background-0">
          {/* Header */}
          <Box className="bg-primary-500 p-4 pt-12">
            <HStack className="items-center justify-between">
              <Heading size="lg" className="text-white font-satoshi">
                Complete Payment
              </Heading>
              <Button
                className="bg-white/20"
                size="sm"
                onPress={() => {
                  console.log("🔙 Payment WebView closed by user");
                  Alert.alert(
                    "Close Payment",
                    "Have you completed the payment?",
                    [
                      {
                        text: "Yes, Check Status",
                        onPress: async () => {
                          setShowWebView(false);
                          setVerifyingPayment(true);
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          const isActivated = await checkSubscriptionActivation(10);
                          setVerifyingPayment(false);
                          if (isActivated) {
                            onSuccess();
                          } else {
                            Alert.alert(
                              "Subscription Not Active",
                              "We couldn't find an active subscription. If you completed payment, please wait a moment and try refreshing.",
                              [{ text: "OK", onPress: () => onClose() }]
                            );
                          }
                        },
                      },
                      {
                        text: "No, Cancel",
                        onPress: () => {
                          setShowWebView(false);
                          onClose();
                        },
                        style: "cancel",
                      },
                    ]
                  );
                }}
              >
                <ButtonText className="text-white font-semibold">Close</ButtonText>
              </Button>
            </HStack>
          </Box>

          {/* WebView */}
          <WebView
            ref={webViewRef}
            source={{ uri: smartLinkUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              onError("Failed to load payment page");
              setShowWebView(false);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <Box className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="text-typography-500 mt-4">Loading payment page...</Text>
              </Box>
            )}
            keyboardDisplayRequiresUserAction={false}
            scrollEnabled={true}
            bounces={true}
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustContentInsets={true}
          />
        </Box>
      </Modal>
    );
  }

  // Verification Modal
  if (verifyingPayment) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <Box className="flex-1 bg-black/90 justify-center items-center p-6">
          <AnimatedBox
            className="bg-background-0 rounded-3xl p-8 items-center"
            entering={SlideInDown.duration(400).springify()}
          >
            <ActivityIndicator size="large" color="#FF6B9D" />
            <Text className="text-typography-950 text-lg font-semibold font-satoshi mt-6">
              Verifying Payment
            </Text>
            <Text className="text-typography-600 text-sm font-roboto text-center mt-2">
              Please wait while we confirm your payment and activate your subscription...
            </Text>
          </AnimatedBox>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={processing ? undefined : onClose}
    >
      <Box className="flex-1 bg-black/80 justify-end">
        <AnimatedBox
          className="bg-background-0 rounded-t-3xl overflow-hidden"
          entering={SlideInDown.duration(400).springify()}
        >
          {/* Header */}
          <LinearGradient
            colors={["#FF6B9D", "#C239B3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <VStack className="gap-2">
              <Heading size="2xl" className="text-white font-satoshi">
                Complete Payment
              </Heading>
              <Text className="text-white/80 text-sm font-roboto">
                You're about to subscribe to {plan.displayName}
              </Text>
            </VStack>
          </LinearGradient>

          {/* Content */}
          <VStack className="p-6 gap-6">
            {/* Plan Summary */}
            <VStack className="gap-4">
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <Heading size="lg" className="text-typography-950 font-satoshi">
                    {plan.displayName}
                  </Heading>
                  <Text className="text-typography-600 text-sm font-roboto mt-1">
                    {getPlanDurationText(plan.duration)} subscription
                  </Text>
                </VStack>
                <Box className="bg-primary-100 px-4 py-2 rounded-full">
                  <Text className="text-primary-600 font-bold text-lg">
                    {formatPrice(plan.price)}
                  </Text>
                </Box>
              </HStack>

              {/* Features Preview */}
              <Box className="bg-background-50 rounded-xl p-4">
                <Text className="text-typography-900 text-sm font-semibold font-roboto mb-3">
                  What you'll get:
                </Text>
                <VStack className="gap-2">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <HStack key={index} className="items-start gap-2">
                      <Text className="text-primary-500 text-sm">✓</Text>
                      <Text className="text-typography-700 text-sm font-roboto flex-1">
                        {feature}
                      </Text>
                    </HStack>
                  ))}
                  {plan.features.length > 3 && (
                    <Text className="text-typography-500 text-xs font-roboto mt-1">
                      +{plan.features.length - 3} more features
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>

            <Divider className="bg-background-100" />

            {/* Price Breakdown */}
            <VStack className="gap-3">
              <Text className="text-typography-900 text-sm font-semibold font-roboto">
                Price Breakdown
              </Text>

              <VStack className="gap-2">
                <HStack className="justify-between items-center">
                  <Text className="text-typography-600 text-sm font-roboto">
                    Subscription ({getPlanDurationText(plan.duration)})
                  </Text>
                  <Text className="text-typography-900 text-sm font-roboto">
                    {formatPrice(plan.price)}
                  </Text>
                </HStack>

                <HStack className="justify-between items-center">
                  <Text className="text-typography-600 text-sm font-roboto">
                    GST (18%)
                  </Text>
                  <Text className="text-typography-900 text-sm font-roboto">
                    ₹{gstAmount}
                  </Text>
                </HStack>

                <Divider className="bg-background-100 my-2" />

                <HStack className="justify-between items-center">
                  <Heading size="md" className="text-typography-950 font-satoshi">
                    Total Amount
                  </Heading>
                  <Heading size="lg" className="text-primary-600 font-satoshi">
                    ₹{totalAmount}
                  </Heading>
                </HStack>
              </VStack>
            </VStack>

            <Divider className="bg-background-100" />

            {/* Payment Info */}
            <Box className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-4">
              <HStack className="items-start gap-3">
                <Text className="text-2xl">🔒</Text>
                <VStack className="flex-1">
                  <Text className="text-typography-900 text-sm font-semibold font-roboto">
                    Secure Payment
                  </Text>
                  <Text className="text-typography-600 text-xs font-roboto mt-1">
                    Your payment is secured by Instamojo. Your subscription will be activated automatically after successful payment.
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Action Buttons */}
            <VStack className="gap-3 mt-2">
              <Button
                className="bg-primary-500 data-[active=true]:bg-primary-600"
                size="lg"
                onPress={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <HStack className="items-center gap-2">
                    <ActivityIndicator color="white" size="small" />
                    <ButtonText className="font-semibold font-roboto">
                      Processing...
                    </ButtonText>
                  </HStack>
                ) : (
                  <ButtonText className="font-semibold font-roboto">
                    Pay ₹{totalAmount}
                  </ButtonText>
                )}
              </Button>

              <Button
                className="bg-background-100 data-[active=true]:bg-background-200"
                size="lg"
                onPress={onClose}
                disabled={processing}
              >
                <ButtonText className="text-typography-900 font-semibold font-roboto">
                  Cancel
                </ButtonText>
              </Button>
            </VStack>

            {/* Terms */}
            <Text className="text-typography-500 text-xs text-center font-roboto">
              By proceeding, you agree to our Terms of Service and Privacy Policy.
              Your subscription will be activated after successful payment.
            </Text>
          </VStack>
        </AnimatedBox>
      </Box>
    </Modal>
  );
};
