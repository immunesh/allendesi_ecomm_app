import { View, Text } from 'react-native'
import React from 'react'

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

const loadStorageInfo = async () => {
  try {
    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();

    // Calculate storage for different categories
    let totalSize = 0;
    let cacheSize = 0;
    let dataSize = 0;
    let imagesSize = 0;

    // Get all key-value pairs
    const keyValuePairs = await AsyncStorage.multiGet(keys);

    for (const [key, value] of keyValuePairs) {
  if (value) {
    const itemSize = new Blob([value]).size;
    totalSize += itemSize;

    // Categorize storage based on key names
    if (
      key.includes("cache") ||
      key.includes("temp") ||
      key.includes("image")
    ) {
      cacheSize += itemSize;
    } else if (
      key.includes("user") ||
      key.includes("settings")
    ) {
      dataSize += itemSize;
    } else if (
      key.includes("image") ||
      key.includes("avatar")
    ) {
      imagesSize += itemSize;
    } else {
      dataSize += itemSize;
    }
  }
}

// Convert bytes to MB and format
const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return mb > 0.1
    ? `${mb.toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
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

  // Fallback to default values if calculation fails
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
            // Clear cache-related AsyncStorage keys
const keys = await AsyncStorage.getAllKeys();
const cacheKeys = keys.filter(key =>
  key.includes("cache") ||
  key.includes("temp") ||
  key.includes("image")
);

if (cacheKeys.length > 0) {
  await AsyncStorage.multiRemove(cacheKeys);
  toast.success(`Cache cleared successfully (${cacheKeys.length} items)`);
} else {
  toast.success("No cache items found to clear");
}

// Reload storage info to show updated sizes
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

          // Reload storage info to show updated sizes
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
  <View className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border">
    <View className="flex-row items-center justify-between">
      
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: bgColor }}
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        <View>
          <Text className="text-gray-900 font-poppins-semibold text-lg">
            {title}
          </Text>

                    <Text className="text-gray-500 font-poppins-medium text-sm">
            {size}
          </Text>
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
) => (
  <TouchableOpacity
    className={`rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border p-4 ${
      isDestructive
        ? "border-red-200 bg-red-50"
        : "border-gray-100 bg-white"
    }`}
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
          <Text
            className={`font-poppins-semibold text-lg ${
              isDestructive ? "text-red-600" : "text-gray-900"
            }`}
          >
            {title}
          </Text>

                    <Text
            className={`font-poppins-medium text-sm ${
              isDestructive ? "text-red-500" : "text-gray-500"
            }`}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDestructive ? "#DC2626" : "#9CA3AF"}
      />
    </View>
  </TouchableOpacity>
);


if (isLoading) {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
          > 
           <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-xl font-poppins-bold text-gray-900">
            Data & Storage
          </Text>

        </View>
      </View>
            {/* Loading State */}
      <View className="flex-1 justify-center items-center">
        <View className="animate-spin">
          <Ionicons name="refresh" size={48} color="#6B7280" />
        </View>

        <Text className="text-gray-500 font-poppins-medium mt-4 text-center">
          Loading storage information...
        </Text>
      </View>
    </SafeAreaView>
  );
}
<SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
  <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

  {/* Header */}
  <View className="bg-white px-4 py-4 border-b border-gray-100">
    <View className="flex-row items-center">
      
      <TouchableOpacity
        onPress={() => router.back()}
        className="mr-4"
      >
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

      <Text className="text-xl font-poppins-bold text-gray-900">
        Data Usage
      </Text>

    </View>
  </View>

  {/* Bottom Spacing */}
<View className="h-20" />
</ScrollView>
 
  </SafeAreaView>

  return (
    <View>
      <Text>DataUsageScreen</Text>
    </View>
  )
}