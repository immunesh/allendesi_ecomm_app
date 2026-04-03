import React from "react";
import { View } from "react-native";

type ProductSkeletonProps = {
  width?: number;
};

export default function ProductSkeleton({ width = 160 }: ProductSkeletonProps) {
  return (
    <View
      className="bg-white rounded-lg p-3 mx-2 mb-4 shadow-sm"
      style={{ width }}
    >
      <View className="bg-gray-200 rounded-lg h-32 mb-3 animate-pulse" />
      <View className="bg-gray-200 rounded h-4 mb-2 animate-pulse" />
      <View className="bg-gray-200 rounded h-3 mb-3/4 animate-pulse" />
      <View className="bg-gray-200 rounded h-2 mb-1/2 animate-pulse" />
    </View>
  );
}
 