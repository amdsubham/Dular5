import React, { useEffect, useRef } from "react";
import { Box } from "@/components/ui/box";
import { Dimensions, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

const { width, height } = Dimensions.get("window");

export const SplashScreen = () => {
  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.9)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Create animation sequence
    const animation = Animated.sequence([
      // Title fade and scale in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Small delay before subtitle
      Animated.delay(200),
      // Subtitle fade and slide up
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    // Cleanup function to stop animations when component unmounts
    return () => {
      animation.stop();
    };
  }, [titleOpacity, titleScale, subtitleOpacity, subtitleTranslateY]);

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C239B3', '#8B3A9F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width, height }}
    >
      <Box className="flex-1 justify-center items-center px-8">
        {/* Main Title - Dular */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
            alignItems: 'center',
            paddingVertical: 20,
          }}
        >
          <Heading style={styles.title}>
            Dular
          </Heading>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <Text style={styles.subtitle}>
            For Our Santal Community
          </Text>
        </Animated.View>
      </Box>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Satoshi',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    lineHeight: 80,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
    fontFamily: 'Roboto',
    opacity: 0.95,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
});
