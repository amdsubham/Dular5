import React, { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon, ThreeDotsIcon, ImageIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { ArrowLeftIcon, SendIcon } from "@/components/ui/icon";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Alert, ActionSheetIOS, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser } from "@/services/auth";
import {
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  addReactionToMessage,
  removeReactionFromMessage,
  sendMessageWithImage,
  Message,
} from "@/services/messaging";
import { blockUser, unmatchUser } from "@/services/blocking";
import { subscribeToUserStatus, formatLastSeen } from "@/services/presence";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadImageToFirebase } from "@/services/storage";

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const chatId = params.id as string;
  const userId = params.userId as string;
  const userName = params.userName as string;

  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const currentUser = getCurrentUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [userLastSeen, setUserLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize chat
    const initChat = async () => {
      const chatExists = await getOrCreateChat(chatId);
      if (!chatExists) {
        console.error("Failed to create/get chat");
        return;
      }
      setLoading(false);

      // Mark messages as read when entering chat
      await markMessagesAsRead(chatId);
    };

    initChat();

    // Subscribe to messages
    const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      unsubscribe();
      // Mark as read when leaving
      markMessagesAsRead(chatId);
    };
  }, [chatId]);

  // Subscribe to other user's online status
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserStatus(
      userId,
      (isOnline, lastSeen) => {
        setIsUserOnline(isOnline);
        setUserLastSeen(lastSeen);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const success = await sendMessage(chatId, inputText);
    if (success) {
      setInputText("");
    }
  };

  const handleShowMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "View Profile", "Unmatch", "Block User"],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push({
              pathname: "/(protected)/user-profile/[id]" as any,
              params: { id: userId },
            });
          } else if (buttonIndex === 2) {
            handleUnmatch();
          } else if (buttonIndex === 3) {
            handleBlock();
          }
        }
      );
    } else {
      // Android - show custom alert
      Alert.alert(
        "Options",
        "Choose an action",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Profile",
            onPress: () => {
              router.push({
                pathname: "/(protected)/user-profile/[id]" as any,
                params: { id: userId },
              });
            },
          },
          { text: "Unmatch", onPress: handleUnmatch },
          { text: "Block User", onPress: handleBlock, style: "destructive" },
        ],
        { cancelable: true }
      );
    }
  };

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch",
      `Are you sure you want to unmatch with ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            const success = await unmatchUser(userId);
            if (success) {
              Alert.alert("Success", "You have unmatched successfully.");
              router.back();
            } else {
              Alert.alert("Error", "Failed to unmatch. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${userName}? You will no longer see each other and all messages will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(userId);
            if (success) {
              Alert.alert("Success", "User has been blocked.");
              router.back();
            } else {
              Alert.alert("Error", "Failed to block user. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        // Compress image
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload to Firebase
        const imageUrl = await uploadImageToFirebase(manipulated.uri, "chat-images");

        if (imageUrl) {
          await sendMessageWithImage(chatId, imageUrl);
        } else {
          Alert.alert("Error", "Failed to upload image");
        }

        setUploadingImage(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to send image");
      setUploadingImage(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !currentUser) return;

    // Check if user already reacted with this emoji
    const userReaction = message.reactions?.[currentUser.uid];

    if (userReaction === emoji) {
      // Remove reaction
      await removeReactionFromMessage(chatId, messageId);
    } else {
      // Add or update reaction
      await addReactionToMessage(chatId, messageId, emoji);
    }
  };

  const showReactionPicker = (messageId: string) => {
    const reactions = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...reactions],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            handleReaction(messageId, reactions[buttonIndex - 1]);
          }
        }
      );
    } else {
      Alert.alert(
        "React to message",
        "Choose a reaction",
        [
          { text: "Cancel", style: "cancel" },
          ...reactions.map((emoji) => ({
            text: emoji,
            onPress: () => handleReaction(messageId, emoji),
          })),
        ],
        { cancelable: true }
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;
    const reactions = item.reactions || {};
    const reactionEntries = Object.entries(reactions);

    return (
      <Pressable
        onLongPress={() => showReactionPicker(item.id)}
        className={`mb-3 px-4 ${
          isCurrentUser ? "items-end" : "items-start"
        }`}
      >
        <Box
          className={`max-w-[75%] rounded-2xl ${
            isCurrentUser
              ? "bg-primary-500 rounded-tr-none"
              : "bg-background-100 rounded-tl-none"
          }`}
        >
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-64 h-64 rounded-xl"
              alt="Shared image"
            />
          )}
          {item.text ? (
            <Box className="px-4 py-2">
              <Text
                className={`${
                  isCurrentUser ? "text-white" : "text-typography-900"
                } font-roboto text-base`}
              >
                {item.text}
              </Text>
            </Box>
          ) : null}

          {/* Reactions */}
          {reactionEntries.length > 0 && (
            <Box className="absolute -bottom-2 -right-2 flex-row bg-background-0 rounded-full px-2 py-1 border border-background-200">
              {reactionEntries.slice(0, 3).map(([userId, emoji], index) => (
                <Text key={userId} className="text-sm" style={{ marginLeft: index > 0 ? -4 : 0 }}>
                  {emoji}
                </Text>
              ))}
              {reactionEntries.length > 3 && (
                <Text className="text-xs text-typography-500 ml-1">
                  +{reactionEntries.length - 3}
                </Text>
              )}
            </Box>
          )}
        </Box>
        <Text className="text-typography-400 text-xs font-roboto mt-1">
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background-0"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <Box
        className="bg-background-0 border-b border-background-100 px-4 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <HStack className="items-center gap-3">
          <Pressable onPress={() => router.back()}>
            <Icon as={ArrowLeftIcon} className="w-6 h-6 text-typography-900" />
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center gap-3"
            onPress={() => {
              // Navigate to user profile
              router.push({
                pathname: "/(protected)/user-profile/[id]" as any,
                params: { id: userId },
              });
            }}
          >
            <Box className="relative">
              <Box className="w-10 h-10 rounded-full bg-background-200 items-center justify-center">
                <Text className="text-lg font-roboto font-semibold">
                  {userName?.charAt(0) || "U"}
                </Text>
              </Box>
              {isUserOnline && (
                <Box className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success-500 border-2 border-background-0" />
              )}
            </Box>
            <VStack className="flex-1">
              <Heading size="sm" className="font-roboto">
                {userName || "User"}
              </Heading>
              <Text className="text-typography-500 text-xs font-roboto">
                {isUserOnline ? "Active now" : formatLastSeen(userLastSeen)}
              </Text>
            </VStack>
          </Pressable>

          <Pressable onPress={handleShowMenu} className="p-2">
            <Icon as={ThreeDotsIcon} className="w-6 h-6 text-typography-500" />
          </Pressable>
        </HStack>
      </Box>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          loading ? (
            <Box className="flex-1 items-center justify-center p-8">
              <Text className="text-typography-500 text-center font-roboto">
                Loading messages...
              </Text>
            </Box>
          ) : (
            <Box className="flex-1 items-center justify-center p-8">
              <Text className="text-typography-500 text-center font-roboto">
                No messages yet. Say hi! 👋
              </Text>
            </Box>
          )
        }
      />

      {/* Message Input */}
      <Box
        className="bg-background-0 border-t border-background-100 px-4 py-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {uploadingImage && (
          <Box className="pb-2">
            <HStack className="items-center gap-2">
              <ActivityIndicator size="small" color="#EC4899" />
              <Text className="text-typography-500 text-sm font-roboto">
                Uploading image...
              </Text>
            </HStack>
          </Box>
        )}
        <HStack className="items-center gap-2">
          <Pressable
            onPress={handlePickImage}
            className="w-10 h-10 rounded-full bg-background-100 items-center justify-center active:bg-background-200"
            disabled={uploadingImage}
          >
            <Icon as={ImageIcon} className="w-5 h-5 text-typography-700" />
          </Pressable>

          <Input className="flex-1 bg-background-50 rounded-full border-0">
            <InputField
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              className="px-4"
            />
          </Input>

          <Pressable
            onPress={handleSend}
            className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center active:bg-primary-600"
            disabled={!inputText.trim()}
          >
            <Icon
              as={SendIcon}
              className="w-5 h-5 text-white"
            />
          </Pressable>
        </HStack>
      </Box>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
