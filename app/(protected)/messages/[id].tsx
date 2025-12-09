import { KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { ChevronLeftIcon, Icon, ThreeDotsIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { SendIcon } from "@/components/shared/icons";
import { PaperClipIcon } from "@/components/shared/icons";
import { ScrollView } from "@/components/ui/scroll-view";
import { chats } from "@/data/data";

const images = [
  require("@/assets/images/common/profile_1_preview.png"),
  require("@/assets/images/common/profile_avatar.png"),
  require("@/assets/images/common/profile_2_preview.png"),
  require("@/assets/images/common/onboarding_1_preview.png"),
  require("@/assets/images/common/profile_3_preview.png"),
  require("@/assets/images/common/onboarding_2_preview.png"),
  require("@/assets/images/common/profile_4_preview.png"),
  require("@/assets/images/common/onboarding_3_preview.png"),
  require("@/assets/images/common/profile_5_preview.png"),
];

type Chat = {
  id: number;
  name: string;
  age: number;
  online: boolean;
  chats_history: { sender: string; message: string; timestamp: string }[];
};

function Header({ chat }: { chat: Chat }) {
  const router = useRouter();
  return (
    <Box className="flex-row justify-between items-center gap-2">
      <Pressable onPress={() => router.dismiss()} className="p-4">
        <Icon as={ChevronLeftIcon} className="w-5 h-5 text-background-500" />
      </Pressable>
      <Box className="flex-1 flex-row items-center gap-3">
        <Image
          source={images[chat.id % images.length]}
          className="h-12 w-12 rounded-full overflow-hidden"
          alt={chat.name}
        />
        <Box className="flex-col">
          <Text className="font-roboto text-typography-950 font-medium">
            {chat.name}
          </Text>
          {chat.online && (
            <Text className="font-roboto text-typography-green text-sm">
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

function ChatHistory({ chat }: { chat: Chat }) {
  return (
    <Box className="flex-col gap-3 flex-1 p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {chat.chats_history.map((message, index) => (
          <Box
            key={index}
            className={
              "flex flex-col w-full justify-end" +
              (message.sender === "You" ? " items-end" : " items-start")
            }
          >
            <Text
              className={`p-3 font-roboto text-sm font-medium max-w-[246px] rounded-xl ${
                message.sender === "You"
                  ? "bg-primary-950 rounded-br-none"
                  : "bg-background-50 rounded-tl-none"
              }`}
            >
              {message.message}
            </Text>
            <Text className="font-roboto text-xs text-typography-400">
              {message.timestamp}
            </Text>
          </Box>
        ))}
      </ScrollView>
    </Box>
  );
}

function ChatInput() {
  return (
    <Input
      className="bg-background-50 px-4 py-4 h-auto border-0 my-3 mx-4"
      variant="rounded"
    >
      <InputSlot>
        <Icon as={PaperClipIcon} className="w-4 h-4" />
      </InputSlot>
      <InputField
        className="font-roboto text-sm leading-0 text-typography-950"
        placeholder="Type your message..."
      />
      <InputSlot>
        <Icon as={SendIcon} className="w-4 h-4 text-background-500" />
      </InputSlot>
    </Input>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chat = chats[Number(id) - 1];

  return (
    <Box className="flex-1 bg-background-0">
      <Header chat={chat} />
      <ChatHistory chat={chat} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={64}
      >
        <ChatInput />
      </KeyboardAvoidingView>
    </Box>
  );
}
