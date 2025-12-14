import React, { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { ChevronLeftIcon, Icon, ThreeDotsIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { SendIcon, PaperClipIcon } from "@/components/shared/icons";
import { ScrollView } from "@/components/ui/scroll-view";
import { getCurrentUser } from "@/services/auth";
import {
  getOrCreateChat,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  sendMessageWithImage,
  Message,
} from "@/services/messaging";
import { subscribeToUserStatus } from "@/services/presence";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToFirebase } from "@/services/storage";

function Header({
  userName,
  userImage,
  isOnline,
  onBack,
}: {
  userName: string;
  userImage?: string | null;
  isOnline: boolean;
  onBack: () => void;
}) {
  return (
    <Box className="flex-row justify-between items-center gap-2 bg-background-0 border-b border-background-100">
      <Pressable onPress={onBack} className="p-4">
        <Icon as={ChevronLeftIcon} className="w-5 h-5 text-background-500" />
      </Pressable>
      <Box className="flex-1 flex-row items-center gap-3">
        {userImage ? (
          <Image
            source={{ uri: userImage }}
            className="h-12 w-12 rounded-full overflow-hidden"
            alt={userName}
          />
        ) : (
          <Box className="h-12 w-12 rounded-full bg-background-200 items-center justify-center">
            <Text className="text-xl font-roboto font-semibold">
              {userName?.charAt(0) || "?"}
            </Text>
          </Box>
        )}
        <Box className="flex-col">
          <Text className="font-roboto text-typography-950 font-medium">
            {userName}
          </Text>
          {isOnline && (
            <Text className="font-roboto text-green-500 text-sm">
              Online
            </Text>
          )}
        </Box>
      </Box>
      <Pressable className="p-4">
        <Icon as={ThreeDotsIcon} className="w-6 h-6 text-background-500" />
      </Pressable>
    </Box>
  );
}

function ChatBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <Box
      className={
        "flex flex-col w-full mb-3" +
        (isOwn ? " items-end" : " items-start")
      }
    >
      {message.imageUrl && (
        <Image
          source={{ uri: message.imageUrl }}
          className="max-w-[246px] rounded-xl mb-2"
          style={{ aspectRatio: 1 }}
          alt="Sent image"
        />
      )}
      {message.text && (
        <Text
          className={`p-3 font-roboto text-sm font-medium max-w-[246px] rounded-xl ${
            isOwn
              ? "bg-primary-950 text-white rounded-br-none"
              : "bg-background-50 text-typography-950 rounded-tl-none"
          }`}
        >
          {message.text}
        </Text>
      )}
      <Text className="font-roboto text-xs text-typography-400 mt-1">
        {formatTime(message.timestamp)}
      </Text>
    </Box>
  );
}

function ChatHistory({
  messages,
  currentUserId,
  flatListRef,
}: {
  messages: Message[];
  currentUserId: string;
  flatListRef: React.RefObject<FlatList>;
}) {
  if (messages.length === 0) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text className="text-4xl mb-2">💬</Text>
        <Text className="font-roboto text-typography-500">
          No messages yet. Say hi! 👋
        </Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 p-4">
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={item.senderId === currentUserId}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
    </Box>
  );
}

function ChatInput({
  inputText,
  setInputText,
  onSend,
  onAttach,
  uploading,
}: {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  uploading: boolean;
}) {
  return (
    <Input
      className="bg-background-50 px-4 py-4 h-auto border-0 my-3 mx-4"
      variant="rounded"
    >
      <InputSlot onPress={onAttach}>
        {uploading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Icon as={PaperClipIcon} className="w-4 h-4" />
        )}
      </InputSlot>
      <InputField
        className="font-roboto text-sm leading-0 text-typography-950"
        placeholder="Type your message..."
        value={inputText}
        onChangeText={setInputText}
        onSubmitEditing={onSend}
      />
      <InputSlot onPress={onSend}>
        <Icon as={SendIcon} className="w-4 h-4 text-background-500" />
      </InputSlot>
    </Input>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const chatId = params.id as string;
  const userId = params.userId as string;
  const userName = params.userName as string;

  const flatListRef = useRef<FlatList>(null);
  const currentUser = getCurrentUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);

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
      (isOnline) => {
        setIsUserOnline(isOnline);
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

  const handleAttach = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        // Upload to Firebase
        const imageUrl = await uploadImageToFirebase(result.assets[0].uri, 'chat-images');

        // Send message with image
        if (imageUrl) {
          await sendMessageWithImage(chatId, imageUrl, inputText || undefined);
          setInputText("");
        }

        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-0">
        <ActivityIndicator size="large" />
        <Text className="text-typography-500 mt-4 font-roboto">
          Loading chat...
        </Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-background-0">
      <Header
        userName={userName}
        userImage={userImage}
        isOnline={isUserOnline}
        onBack={() => router.back()}
      />
      <ChatHistory
        messages={messages}
        currentUserId={currentUser?.uid || ""}
        flatListRef={flatListRef}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={64}
      >
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          onAttach={handleAttach}
          uploading={uploadingImage}
        />
      </KeyboardAvoidingView>
    </Box>
  );
}
