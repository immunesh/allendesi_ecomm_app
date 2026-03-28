import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ShopCardProps {
  shop: {
    id: number | string;
    name?: string;
    avatar?: string;
    cover_image?: string;
    rating?: number | string;
  };
  onPress?: () => void;
}

export default function ShopCard({ shop, onPress }: ShopCardProps) {
  return (
    <TouchableOpacity
      className="w-64 mr-4 bg-white rounded-2xl overflow-hidden border border-gray-100"
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Image
        source={{ uri: shop?.cover_image || shop?.avatar || "" }}
        className="w-full h-28 bg-gray-100"
        resizeMode="cover"
      />

      <View className="p-4">
        <View className="flex-row items-center">
          <Image
            source={{ uri: shop?.avatar || shop?.cover_image || "" }}
            className="w-12 h-12 rounded-full mr-3 bg-gray-100"
            resizeMode="cover"
          />

          <View className="flex-1">
            <Text className="text-base font-poppins-semibold text-gray-900" numberOfLines={1}>
              {shop?.name || "Shop"}
            </Text>

            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-sm text-gray-600 ml-1 font-medium">
                {shop?.rating ?? "0.0"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
