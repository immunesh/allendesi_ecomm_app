import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { AntDesign, Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { ReactNode } from "react";
import { Platform, useColorScheme, View, Text } from "react-native";
import { useStore } from "@/store";
import { useUnreadMessages } from "@/hooks/useUnreadMessages"; // added missing hook import

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Provide a transparent background for the tab bar (iOS style)
  const BlurTabBarBackground = (): ReactNode => null;

  // Ensure the active tab icon color is always visible (not white)
  const activeTintColor =
    Colors[colorScheme ?? "light"].tint === "#fff" ||
    Colors[colorScheme ?? "light"].tint === "white"
      ? "#2563EB" // fallback to a visible blue
      : Colors[colorScheme ?? "light"].tint;

  const { wishlist, cart } = useStore();
  const {totalUnread} = useUnreadMessages();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: BlurTabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a Transparent background on IOS
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <Feather name="heart" size={size} color={color} />
              {wishlist.length > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-xs text-white font-poppins-semibold">
                    {wishlist.length > 99 ? "99+" : wishlist.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
            <AntDesign name="message" size={size} color={color} />
            {totalUnread > 0 && (
  <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-1.5">
    <Text className="text-white text-xs font-bold">
      {totalUnread > 99 ? "99+" : totalUnread}
    </Text>
  </View>
)}
</View>
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <Feather name="shopping-bag" size={size} color={color} />
              {cart.length > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-xs text-white font-poppins-semibold">
                    {cart.length > 99 ? "99+" : cart.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
