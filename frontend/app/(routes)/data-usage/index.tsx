import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

interface StorageInfo {
  totalSize: string;
  cacheSize: string;
  dataSize: string;
  imagesSize: string;
}

export default function DataUsageScreen() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSize: "0 MB",
    cacheSize: "0 MB",
    dataSize: "0 MB",
    imagesSize: "0 MB",
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const estimateByteSize = (value: string) => {
    // TextEncoder is preferred when available; fallback keeps compatibility.
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(value).length;
    }

    return unescape(encodeURIComponent(value)).length;
  };

  const loadStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      let totalSize = 0;
      let cacheSize = 0;
      let dataSize = 0;
      let imagesSize = 0;

      const keyValuePairs = await AsyncStorage.multiGet(keys);

      for (const [key, value] of keyValuePairs) {
        if (!value) continue;
        const itemSize = estimateByteSize(value);
        totalSize += itemSize;

        if (key.includes("cache") || key.includes("temp") || key.includes("image")) {
          cacheSize += itemSize;
        } else if (key.includes("image") || key.includes("avatar")) {
          imagesSize += itemSize;
        } else {
          dataSize += itemSize;
        }
      }

      const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return mb > 0.1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
      };

      const realStorageInfo: StorageInfo = {
        totalSize: formatSize(totalSize),
        cacheSize: formatSize(cacheSize),
        dataSize: formatSize(dataSize),
        imagesSize: formatSize(imagesSize),
      };

      setStorageInfo(realStorageInfo);
    } catch (error) {
      console.error("Error loading storage info:", error);

      setStorageInfo({
        totalSize: "0 KB",
        cacheSize: "0 KB",
        dataSize: "0 KB",
        imagesSize: "0 KB",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data including images and temporary files.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(
                (key) => key.includes("cache") || key.includes("temp") || key.includes("image")
              );

              if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
                toast.success(`Cache cleared successfully (${cacheKeys.length} items)`);
              } else {
                toast.success("No cache items found to clear");
              }

              await loadStorageInfo();
            } catch (error) {
              console.error("Error clearing cache:", error);
              toast.error("Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all app data including settings, preferences, and cache.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              toast.success("All data cleared successfully");
              await loadStorageInfo();
            } catch (error) {
              console.error("Error clearing all data:", error);
              toast.error("Failed to clear data");
            }
          },
        },
      ]
    );
  };

  const renderStorageCard = (
    title: string,
    size: string,
    icon: string,
    color: string,
    bgColor: string
  ) => (
    <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border p-4 mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: bgColor }}
          >
            <Ionicons name={icon as any} size={24} color={color} />
          </View>

          <View>
            <Text className="text-gray-900 font-poppins-semibold text-lg">{title}</Text>
            <Text className="text-gray-500 font-poppins-medium text-sm">{size}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderActionButton = (
    title: string,
    subtitle: string,
    icon: string,
    color: string,
    bgColor: string,
    onPress: () => void,
    isDestructive = false
  ) => {
    const touchableClass = isDestructive
      ? "rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border p-4 border-red-200 bg-red-50"
      : "rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border p-4 border-gray-100 bg-white";

    const titleClass = isDestructive ? "font-poppins-semibold text-lg text-red-600" : "font-poppins-semibold text-lg text-gray-900";
    const subtitleClass = isDestructive ? "font-poppins-medium text-sm text-red-500" : "font-poppins-medium text-sm text-gray-500";
    const iconColor = isDestructive ? "#DC2626" : "#9CA3AF";

    return (
      <TouchableOpacity
        className={touchableClass}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: bgColor }}
            >
              <Ionicons name={icon as any} size={24} color={color} />
            </View>

            <View>
              <Text className={titleClass}>{title}</Text>
              <Text className={subtitleClass}>{subtitle}</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={iconColor} />
        </View>
      </TouchableOpacity>
    );
  };


  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
        <StatusBar style="dark" />

        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="text-xl font-poppins-bold text-gray-900">Data & Storage</Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center">
          <Ionicons name="refresh" size={48} color="#6B7280" />
          <Text className="text-gray-500 font-poppins-medium mt-4 text-center">
            Loading storage information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar style="dark" />

      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-xl font-poppins-bold text-gray-900">Data Usage</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {renderStorageCard("Total Storage", storageInfo.totalSize, "server-outline", "#2563EB", "#DBEAFE")}
        {renderStorageCard("Cache", storageInfo.cacheSize, "speedometer-outline", "#D97706", "#FEF3C7")}
        {renderStorageCard("App Data", storageInfo.dataSize, "folder-open-outline", "#059669", "#D1FAE5")}
        {renderStorageCard("Images", storageInfo.imagesSize, "image-outline", "#7C3AED", "#EDE9FE")}

        <View className="mt-2 mb-2">
          {renderActionButton(
            "Clear Cache",
            "Remove temporary files and cached images",
            "trash-outline",
            "#D97706",
            "#FEF3C7",
            clearCache
          )}
        </View>

        {renderActionButton(
          "Clear All Data",
          "Reset app data and preferences",
          "warning-outline",
          "#DC2626",
          "#FEE2E2",
          clearAllData,
          true
        )}

        <View className="h-20" />
      </ScrollView>

      {/*
        Preserved note: the previous file had an extra standalone SafeAreaView block
        and an additional fallback return(<View><Text>DataUsageScreen</Text></View>)
        after the loading return, which caused invalid JSX structure.
      */}
    </SafeAreaView>
  );
}