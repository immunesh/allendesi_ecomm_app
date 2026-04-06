import React from "react";
import { Text, View } from "react-native";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  type: "toggle" | "navigation" | "action";
  value?: boolean;
  onPress?: () => void;
}

interface SettingsData {
  notifications: boolean;
  email_notifications: boolean;
  dark_mode: boolean;
  language: string;
  currency: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  notifications: true,
  email_notifications: true,
  dark_mode: false,
  language: "English (US)",
  currency: "USD ($)",
};

export default function Settings() {
  const [settingsData, setSettingsData] = useState<SettingsData>(DEFAULT_SETTINGS);
const [isLoading, setIsLoading] = useState(true);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Load settings from AsyncStorage on component mount
useEffect(() => {
  loadSettings();
}, []);

const loadSettings = async () => {
  try {
    const storedSettings = await AsyncStorage.getItem("user_settings");

    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSettingsData({ ...DEFAULT_SETTINGS, ...parsedSettings });
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    setIsLoading(false);
  }
};

const saveSettings = async (newSettings: SettingsData) => {
  try {
    await AsyncStorage.setItem(
      "user_settings",
      JSON.stringify(newSettings)
    );

    setSettingsData(newSettings);
  } catch (error) {
    console.error("Error saving settings:", error);
    toast.error("Failed to save settings");
  }
};

const handleToggle = async (id: string) => {
  const newSettings = { ...settingsData };

  switch (id) {
    case "notifications":
      newSettings.notifications = !newSettings.notifications;
      break;

    case "email_notifications":
      newSettings.email_notifications = !newSettings.email_notifications;
      break;

    case "dark_mode":
      newSettings.dark_mode = !newSettings.dark_mode;
      break;
  }
    await saveSettings(newSettings);

  toast.success(
    `${id.replace("_", " ")} ${
      newSettings[id as keyof SettingsData] ? "enabled" : "disabled"
    }`
  );
};

const openAppStore = async () => {
  try {
    // For iOS App Store
    await Linking.openURL("https://apps.apple.com/app/your-app-id");
  } catch (error) {
    try {
      // For Google Play Store
      await Linking.openURL(
        "https://play.google.com/store/apps/details?id=your-app-id"
      );
    } catch (error) {
      toast.error("Could not open app store");
    }
  }
};
const openPrivacyPolicy = async () => {
  try {
    await Linking.openURL("https://yourwebsite.com/privacy-policy");
  } catch (error) {
    toast.error("Could not open Privacy Policy");
  }
};

const openTermsConditions = async () => {
  try {
    await Linking.openURL("https://yourwebsite.com/terms-conditions");
  } catch (error) {
    toast.error("Could not open Terms & Conditions");
  }
};

const handleDeleteAccount = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clear all local data
    await AsyncStorage.clear();

    toast.success("Account deleted successfully");
    setShowDeleteModal(false);

    // Navigate to login screen
    router.replace("/(routes)/login");
  } catch (error) {
    console.error("Error deleting account:", error);
    toast.error("Failed to delete account");
  } finally {
    setIsDeleting(false);
  }
};

const confirmDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account? This action cannot be undone.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setShowDeleteModal(true),
      },
    ]
  );
};

const settings: SettingItem[] = [
  {
    id: "notifications",
    title: "Push Notifications",
    subtitle: "Receive notifications about orders and promotions",
    icon: "notifications-outline",
    iconColor: "#2563EB",
    iconBg: "#DBEAFE",
    type: "toggle",
    value: settingsData.notifications,
  },
  {
  id: "email_notifications",
  title: "Email Notifications",
  subtitle: "Receive email updates about your account",
  icon: "mail-outline",
  iconColor: "#059669",
  iconBg: "#D1FAE5",
  type: "toggle",
  value: settingsData.email_notifications,
},
{
  id: "rate_app",
  title: "Rate App",
  subtitle: "Rate us on App Store",
  icon: "star-outline",
  iconColor: "#F59E0B",
  iconBg: "#FEF3C7",
  type: "action",
  onPress: openAppStore,
},
{
  id: "privacy_policy",
  title: "Privacy Policy",
  subtitle: "Read our privacy policy",
  icon: "shield-checkmark-outline",
  iconColor: "#2563EB",
  iconBg: "#DBEAFE",
  type: "action",
  onPress: openPrivacyPolicy,
},

{
  id: "terms_conditions",
  title: "Terms & Conditions",
  subtitle: "Read our terms of service",
  icon: "document-text-outline",
  iconColor: "#6B7280",
  iconBg: "#F3F4F6",
  type: "action",
  onPress: openTermsConditions,
},
];

const renderSettingItem = (item: SettingItem) => (
  <TouchableOpacity
    key={item.id}
    className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)]"
    onPress={item.onPress}
    activeOpacity={0.7}
    disabled={item.type === "toggle"}
  >
    <View className="flex-row items-center">
      {/* Icon */}
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: item.iconBg }}
      >
        <Ionicons
          name={item.icon as any}
          size={24}
          color={item.iconColor}
        />
      </View>

            {/* Content */}
      <View className="flex-1">
        <Text className="text-gray-900 font-poppins-semibold text-lg">
          {item.title}
        </Text>

        {item.subtitle && (
          <Text className="text-gray-500 font-poppins-medium text-sm mt-1">
            {item.subtitle}
          </Text>
        )}
      </View>

            {/* Action */}
      {item.type === "toggle" ? (
        <Switch
          value={item.value}
          onValueChange={() => handleToggle(item.id)}
          trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
          thumbColor={item.value ? "#FFFFFF" : "#FFFFFF"}
          ios_backgroundColor="#E5E7EB"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
  </View>
</TouchableOpacity>
);

const renderSection = (title: string, items: SettingItem[]) => (
  <View className="mb-6">
    <Text className="text-gray-700 font-poppins-semibold text-lg mb-4 px-1">
      {title}
    </Text>

    {items.map(renderSettingItem)}
  </View>
);
const notificationSettings = settings.filter(item =>
  ["notifications", "email_notifications"].includes(item.id)
);

const appSettings = settings.filter(item =>
  ["data_usage"].includes(item.id)
);

const legalSettings = settings.filter(item =>
  ["privacy_policy", "terms_conditions"].includes(item.id)
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
  Account Settings
</Text>
</View>
</View>

      {/* Loading State */}
      <View className="flex-1 justify-center items-center">
        <View className="animate-spin">
          <Ionicons name="refresh" size={48} color="#6B7280" />
        </View>

        <Text className="text-gray-500 font-poppins-medium mt-4 text-center">
          Loading settings...
        </Text>
      </View>
    </SafeAreaView>         
  );
}
 
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
        Account Settings
      </Text>

    </View>
  </View>

  {/* Content */}
<ScrollView
  className="flex-1 p-4"
  showsVerticalScrollIndicator={false}
>
  {/* Notifications */}
{renderSection("Notifications", notificationSettings)}


{/* App Settings */}
{renderSection("App Settings", appSettings)}

{/* Legal */}
{renderSection("Legal", legalSettings)}

{/* Other */}
{renderSection("Other", otherSettings)}

{/* Danger Zone */}
<View className="mb-6">
  <Text className="text-red-600 font-poppins-semibold text-lg mb-4 px-1">
    Danger Zone
  </Text>

  <TouchableOpacity
    className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-red-200 p-4"
    onPress={confirmDeleteAccount}
  >
    <View className="flex-row items-center">
      <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
        <Ionicons name="trash-outline" size={24} color="#DC2626" />
      </View>
      <View className="flex-1">
        <Text className="text-red-600 font-poppins-semibold text-lg">
          Delete Account
        </Text>

        <Text className="text-red-500 font-poppins-medium text-sm mt-1">
          Permanently delete your account and all data
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#DC2626" />
    </View>
  </TouchableOpacity>
</View>

{/*Bottom SPacing*/}
<View className="h-20"/>
</ScrollView>
</SafeAreaView>
  );
}
