import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import {
  HomeFilled,
  HomeOutlined,
  ChatsFilled,
  ChatsOutlined,
  ProfileFilled,
  ProfileOutlined,
  FavouritesFilled,
  FavouritesOutlined,
} from "../icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text } from "@/components/ui/text";
import { useNotificationBadges } from "@/contexts/NotificationContext";

const tabBarData = [
  {
    route: "home",
    filled: HomeFilled,
    outlined: HomeOutlined,
  },
  {
    route: "matches",
    filled: FavouritesFilled,
    outlined: FavouritesOutlined,
  },
  {
    route: "chats",
    filled: ChatsFilled,
    outlined: ChatsOutlined,
  },
  {
    route: "profile",
    filled: ProfileFilled,
    outlined: ProfileOutlined,
  },
];

export const CustomTabBar = (props: BottomTabBarProps) => {
  const { unreadChatsCount, unreadMatchesCount } = useNotificationBadges();

  const getBadgeCount = (routeName: string): number | undefined => {
    if (routeName === "chats" && unreadChatsCount > 0) {
      return unreadChatsCount;
    }
    if (routeName === "matches" && unreadMatchesCount > 0) {
      return unreadMatchesCount;
    }
    return undefined;
  };

  return (
    <Box
      className={`flex flex-row justify-between items-center h-16 gap-4 w-full bg-background-0`}
    >
      {tabBarData.map((route) => {
        const isActive = props.state.routeNames[props.state.index].includes(
          route.route
        );
        const badgeCount = getBadgeCount(route.route);

        return (
          <Button
            key={route.route}
            onPress={() => {
              props.navigation.navigate(route.route);
            }}
            className="relative flex flex-row items-center justify-center gap-2 text-center px-auto flex-1 h-auto py-5 max-w-32"
            variant="link"
          >
            <Box className="relative">
              <ButtonIcon
                className="w-5 h-5"
                as={isActive ? route.filled : route.outlined}
              />
              {badgeCount && badgeCount > 0 && (
                <Box className="absolute -top-1 -right-2 bg-primary-500 min-w-[16px] h-4 rounded-full items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-roboto font-bold">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </Box>
              )}
            </Box>
          </Button>
        );
      })}
    </Box>
  );
};
