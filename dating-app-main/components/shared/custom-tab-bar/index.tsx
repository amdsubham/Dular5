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

const tabBarData = [
  {
    route: "home",
    filled: HomeFilled,
    outlined: HomeOutlined,
  },
  {
    route: "favourites",
    filled: FavouritesFilled,
    outlined: FavouritesOutlined,
    badge: 4,
  },
  {
    route: "chats",
    filled: ChatsFilled,
    outlined: ChatsOutlined,
    badge: 7,
  },
  {
    route: "profile",
    filled: ProfileFilled,
    outlined: ProfileOutlined,
  },
];

export const CustomTabBar = (props: BottomTabBarProps) => {
  return (
    <Box
      className={`flex flex-row justify-between items-center h-16 gap-4 w-full bg-background-0`}
    >
      {tabBarData.map((route) => {
        const isActive = props.state.routeNames[props.state.index].includes(
          route.route
        );
        return (
          <Button
            key={route.route}
            onPress={() => {
              props.navigation.navigate(route.route);
            }}
            className="relative flex flex-row items-center justify-center gap-2 text-center px-auto flex-1 h-auto py-5 max-w-32"
            variant="link"
          >
            <ButtonIcon
              className="w-5 h-5"
              as={isActive ? route.filled : route.outlined}
            />
            {route?.badge && (
              <Box className="relative">
                <Box className="absolute bottom-[5px] -right-0 bg-primary-500 w-4 h-3 rounded-full items-center justify-center">
                  <Text size="xs" className="text-white text-[8px] leading-2.5">
                    {route.badge}
                  </Text>
                </Box>
              </Box>
            )}
          </Button>
        );
      })}
    </Box>
  );
};
