/**
 * Payment Modal - CCAvenue Integration
 *
 * Displays payment summary and initiates CCAvenue checkout via WebView.
 * Shows loading state during payment processing.
 */

import React, { useState, useRef } from "react";
import { Modal, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Divider } from "@/components/ui/divider";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import {
  SubscriptionPlan,
  formatPrice,
  getPlanDurationText,
} from "@/types/subscription";
import {
  initiateCCAvenuePayment,
  getCCAvenuePaymentConfig,
  updateTransactionRecord,
} from "@/services/payment";
import { upgradeSubscription } from "@/services/subscription";
import { auth } from "@/config/firebase";
import { PaymentStatus } from "@/types/subscription";

const AnimatedBox = Animated.createAnimatedComponent(Box);

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
  const [paymentHTML, setPaymentHTML] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState("");
  const webViewRef = useRef<WebView>(null);

  if (!plan) return null;

  const handlePayment = async () => {
    console.log("💳 Pay button clicked!");

    try {
      setProcessing(true);

      console.log("🚀 Starting payment for plan:", plan.id);

      // Initiate CCAvenue payment
      const result = await initiateCCAvenuePayment(plan);

      if (result.success && result.transactionId && result.orderId) {
        console.log("✅ Payment initiated, getting config");

        setCurrentTransactionId(result.transactionId);

        // Get payment configuration
        const paymentConfig = await getCCAvenuePaymentConfig(
          result.orderId,
          plan
        );

        if (!paymentConfig) {
          throw new Error("Failed to get payment configuration");
        }

        // Prepare order data for encryption with all billing details
        const orderData = {
          merchant_id: paymentConfig.merchantId,
          order_id: paymentConfig.orderId,
          currency: paymentConfig.currency,
          amount: paymentConfig.amount,
          redirect_url: paymentConfig.redirectUrl,
          cancel_url: paymentConfig.cancelUrl,
          language: 'EN',
          // Customer name (multiple fields for compatibility)
          customer_name: paymentConfig.billingName,
          billing_name: paymentConfig.billingName,
          billing_address: paymentConfig.billingAddress,
          billing_city: paymentConfig.billingCity,
          billing_state: paymentConfig.billingState,
          billing_zip: paymentConfig.billingZip,
          billing_country: paymentConfig.billingCountry,
          billing_tel: paymentConfig.billingTel,
          billing_email: paymentConfig.billingEmail,
          delivery_name: paymentConfig.billingName,
          delivery_address: paymentConfig.billingAddress,
          delivery_city: paymentConfig.billingCity,
          delivery_state: paymentConfig.billingState,
          delivery_zip: paymentConfig.billingZip,
          delivery_country: paymentConfig.billingCountry,
          delivery_tel: paymentConfig.billingTel,
          // Merchant parameters for reference
          merchant_param1: paymentConfig.billingName,
          merchant_param2: paymentConfig.billingTel,
        };

        console.log("🔐 Requesting encryption from backend...");

        // Call backend to encrypt the request
        // Use your computer's IP address instead of localhost for mobile devices
        const encryptResponse = await fetch('http://192.168.1.5:3002/api/payment/encrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderData }),
        });

        const encryptData = await encryptResponse.json();

        if (!encryptData.success) {
          throw new Error(encryptData.error || "Failed to encrypt payment request");
        }

        console.log("✅ Encryption successful, encrypted length:", encryptData.encRequest.length);

        // Create CCAvenue payment form HTML with encrypted data
        const html = generateCCAvenueHTML({
          ...paymentConfig,
          encRequest: encryptData.encRequest,
        });
        setPaymentHTML(html);
        setShowWebView(true);

        console.log("✅ Opening CCAvenue WebView");
      } else {
        console.error("❌ Payment initiation failed:", result.error);
        onError(result.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      console.error("❌ Payment error:", error);
      onError(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const generateCCAvenueHTML = (config: any): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta charset="UTF-8">
  <style>
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
      margin: 0 auto 150px auto;
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
    }
    .info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: left;
    }
    .info p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
    .info strong {
      color: #333;
    }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 15px;
    }
    .btn:hover {
      background: #5568d3;
    }

    /* Ensure forms and iframes are scrollable */
    iframe, form {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔒 Secure Payment</h2>
    <div class="info">
      <p><strong>Order ID:</strong> ${config.orderId}</p>
      <p><strong>Amount:</strong> ₹${config.amount}</p>
      <p><strong>Merchant:</strong> ${config.merchantId}</p>
      <p><strong>Name:</strong> ${config.billingName}</p>
    </div>
    <div class="loader"></div>
    <p style="color: #666; margin-top: 15px; font-size: 14px;">🔐 Connecting to secure payment gateway...</p>
    <p style="color: #999; margin-top: 10px; font-size: 12px;">Your payment data is encrypted</p>

    <form id="nonseamless" method="post" action="https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction">
      <input type="hidden" name="encRequest" value="${config.encRequest}">
      <input type="hidden" name="access_code" value="${config.accessCode}">
      <noscript>
        <button type="submit" class="btn">Continue to Payment</button>
      </noscript>
    </form>
  </div>

  <script type="text/javascript">
    // Scroll focused input into view when keyboard appears
    document.addEventListener('DOMContentLoaded', function() {
      // Add focus listeners to all input fields
      const addInputListeners = () => {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          input.addEventListener('focus', function(e) {
            setTimeout(() => {
              // Scroll the input into view with some offset
              const rect = e.target.getBoundingClientRect();
              const offset = window.innerHeight / 2 - rect.height / 2;

              if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
                e.target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest'
                });
              }
            }, 300); // Wait for keyboard to appear
          });

          input.addEventListener('blur', function() {
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          });
        });
      };

      // Initial setup
      addInputListeners();

      // Re-run when new content loads (for iframe content)
      const observer = new MutationObserver(addInputListeners);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });

    console.log('✅ Encrypted request ready, submitting to CCAvenue...');
    setTimeout(function() {
      document.getElementById('nonseamless').submit();
    }, 2000);
  </script>
</body>
</html>
    `;
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log("📍 WebView navigation:", url);

    // Check for success URL
    if (url.includes("payment/success") || url.includes("order_status=Success")) {
      console.log("✅ Payment successful!");
      setShowWebView(false);

      try {
        // Update transaction status
        if (currentTransactionId) {
          await updateTransactionRecord(currentTransactionId, {
            status: PaymentStatus.SUCCESS,
            completedAt: new Date(),
          });

          // Upgrade user's subscription
          const currentUser = auth.currentUser;
          if (currentUser) {
            await upgradeSubscription(
              currentUser.uid,
              plan.id,
              currentTransactionId
            );

            console.log("✅ Subscription upgraded successfully");
            onSuccess();
          }
        }
      } catch (error) {
        console.error("❌ Error updating subscription:", error);
        onError("Payment completed but failed to update subscription");
      }
    }

    // Check for cancel/failure URL
    if (
      url.includes("payment/cancel") ||
      url.includes("order_status=Failure") ||
      url.includes("order_status=Aborted")
    ) {
      console.log("❌ Payment cancelled or failed");
      setShowWebView(false);

      // Update transaction status
      if (currentTransactionId) {
        await updateTransactionRecord(currentTransactionId, {
          status: PaymentStatus.FAILED,
          completedAt: new Date(),
          statusMessage: "Payment cancelled by user",
        });
      }

      onError("Payment was cancelled or failed");
    }
  };

  const gstAmount = (plan.price * 0.18).toFixed(2); // 18% GST
  const totalAmount = (plan.price + parseFloat(gstAmount)).toFixed(2);

  if (showWebView) {
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
                  setShowWebView(false);
                  onClose();
                }}
              >
                <ButtonText className="text-white font-semibold">Cancel</ButtonText>
              </Button>
            </HStack>
          </Box>

          {/* WebView */}
          <WebView
            ref={webViewRef}
            source={{ html: paymentHTML }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              onError("Failed to load payment gateway");
              setShowWebView(false);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <Box className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="text-typography-500 mt-4">Loading payment gateway...</Text>
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
                    Your payment is secured by CCAvenue. We don't store your payment details.
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
              Subscription will auto-renew unless cancelled.
            </Text>
          </VStack>
        </AnimatedBox>
      </Box>
    </Modal>
  );
};
