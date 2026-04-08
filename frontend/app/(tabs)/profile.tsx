import useUser from "@/hooks/useUser";
import { deleteStoredItem, getStoredItem } from "@/utils/storage";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Modal, SafeAreaView, Text, View } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
export default function Profile() {
  const { user, updateUserData } = useUser();
  const [showPhotoModel, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string>("");
  const [isUploading, setisUploading] = useState(false);
  const [appliedFeatures, setAppliedFeatures] = useState<string[]>([]);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  const avatarUrl = user?.avatar?.url;
  const avatarFileId = user?.avatar?.file_id;
  const profileImageUri = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}updated=${encodeURIComponent(avatarFileId || avatarUrl)}`
    : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60";

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permission required" });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Failed to pick image. Please try again.",
      });
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Sorry, we need camera permissions to make this work!",
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowAIFeatures(true);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Toast.show({
        type: "error",
        text1: "Failed to take photo. Please try again.",
      });
    }
  };

  const uploadedImage = async (imageUri: string) => {
    setisUploading(true);
    try {
      // Convert the image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as any;
            const base64Data = base64.split(",")[1];
            console.log(process.env.EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY);
            // Upload to image to ImageKit
            const formData = new FormData();
            formData.append("file", base64Data);
            formData.append("fileName", `profile_${Date.now()}.jpg`);
            formData.append("folder", "/profile-avatars");
            formData.append("useUniqueFileName", "true");

            const imageKitResponse = await fetch(
              "https://upload.imagekit.io/api/v1/files/upload",
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(process.env.EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY! + ":")}`,
                },
                body: formData,
              },
            );
            const imageKitData = await imageKitResponse.json();
            if (imageKitData.url) {
              const imageUrl = imageKitData.url;
              const publicId = imageKitData.fileId;
              setUploadedImageUrl(imageUrl);
              setUploadedImageId(publicId);
              Toast.show({
                type: "success",
                text1:
                  "Image uploaded successfully! Now you can apply AI features",
              });
              resolve(imageKitData);
            } else {
              throw new Error("Failed to upload image to ImageKit");
            }
          } catch (error) {
            console.error("Error uploading image to ImageKit:", error);
            Toast.show({
              type: "error",
              text1: "Failed to upload image. Please try again.",
            });
            reject(error);
          } finally {
            setisUploading(false);
          }
        };
        reader.onerror = () => {
          setisUploading(false);
          Toast.show({
            type: "error",
            text1: "Failed to process image. Please try again.",
          });
          reject(new Error("Failed to read image file"));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error processing image:", error);
      Toast.show({
        type: "error",
        text1: "Failed to process image. Please try again.",
      });
      setisUploading(false);
    }
  };

  const logOutHandler = async () => {
    try {
      await deleteStoredItem("user");
      await deleteStoredItem("accessToken");
      await deleteStoredItem("refreshToken");
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      Toast.show({ type: "error", text1: "Logout failed. Please try again." });
    }
  };

  const saveFinalImage = async () => {
    if (!uploadedImageUrl) return;
    setisUploading(true);
    try {
      const avatarData = {
        url: uploadedImageUrl,
        file_id: uploadedImageId,
      };

      const token = (await getStoredItem("accessToken")) || "";
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const response = await axiosInstance.post(
        "/auth/api/update-avatar",
        avatarData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data.success) {
        //Update user data with new avatar
        if (response.data.user) {
          await updateUserData(response.data.user);
        }
        Toast.show({
          type: "success",
          text1: "Profile picture updated successfully!",
        });
        setShowPhotoModal(false);
        setSelectedImage(null);
        setShowAIFeatures(false);
        setAppliedFeatures([]);
        setUploadedImageUrl(null);
        setUploadedImageId("");
      }
    } catch (error: any) {
      console.error("Error saving profile picture:", error);
      Toast.show({
        type: "error",
        text1:
          error?.message ||
          "Failed to save profile picture. Please sign in again and try.",
      });
    } finally {
      setisUploading(false);
    }
  };

  const applyAIFeature = async (feature: string) => {
    if (!uploadedImageUrl) return;
    setIsApplyingAI(true);
    try {
      //Get the base URL without any existing transformations
      const baseUrl = uploadedImageUrl.split("?")[0];

      //Build transformation string based on selected feature
      let transformations = [];

      //Add the new feature
      switch (feature) {
        case "bg-remove":
          // Remove background
          transformations.push("e-bgremove");
          break;
        case "relight":
          // Relight the image
          transformations.push("e-relight");
          break;
        case "quality-improve":
          // Improve image quality
          transformations.push("e-retouch");
          break;
        default:
          break;
      }
      //Simulate loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 6000));
      const finalUrl = `${baseUrl}?tr=${transformations.join(",")}`;
      setUploadedImageUrl(finalUrl);

      //update applied feature
      if (appliedFeatures.includes(feature)) {
        setAppliedFeatures((appliedFeatures: string[]) =>
          appliedFeatures.filter((f: string) => f !== feature),
        );
      } else {
        setAppliedFeatures([...appliedFeatures, feature]);
      }
      Toast.show({
        type: "success",
        text1: `${feature} applied successfully!`,
      });
    } catch (error) {
      console.error(`Error applying ${feature}`, error);
      Toast.show({
        type: "error",
        text1: `Failed to apply ${feature}. Please try again.`,
      });
    } finally {
      setIsApplyingAI(false);
    }
  };

  const renderPhotoModal = () => (
    <Modal
      visible={showPhotoModel}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
          <Text className="text-xl font-poppins-semibold text-gray-800">
            Change Photo
          </Text>

          <TouchableOpacity
            onPress={() => {
              setShowPhotoModal(false);
              setSelectedImage(null);
              setShowAIFeatures(false);
            }}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {!selectedImage || !showAIFeatures ? (
            //Upload Options
            <View className="gap-4 ">
              <Text
                className="text-lg font-poppins-semibold text-gray-700 "
                style={{ marginBottom: 10, marginLeft: 10, marginTop: 10 }}
              >
                Choose how you want to add your profile picture
              </Text>
              <TouchableOpacity
                className="flex-row mb-2 items-center p-4 border border-gray-200 rounded-xl"
                onPress={takePhoto}
                style={{ marginBottom: 10, marginLeft: 10, marginTop: 10 }}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="camera" size={24} color="#2563EB" />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-poppins-semibold text-gray-800">
                    Take Photo
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 font-poppins-semibold flex-1">
                      Use your camera to take a new photo
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#6B7280"
                      style={{ marginLeft: 8, marginRight: 30 }}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 border border-gray-200 rounded-xl"
                onPress={pickImage}
                style={{ marginBottom: 10, marginLeft: 10, marginTop: 10 }}
              >
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="images" size={24} color="#059669" />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-poppins-semibold text-gray-800">
                    Choose from Library
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-500 font-poppins-semibold flex-1">
                      Select a photo from your gallery
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#6B7280"
                      style={{ marginLeft: 8, marginRight: 30 }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            //Image Preview and AI Features
            <View className="space-y-6">
              <View className="items-center">
                {isApplyingAI ? (
                  <View className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center">
                    <View className="animate-spin">
                      <Ionicons name="refresh" size={32} color="#6B7280" />
                    </View>
                    <Text className="text-xs text-gray-500 mt-2">
                      Applying AI ...
                    </Text>
                  </View>
                ) : (
                  <Image
                    key={(uploadedImageUrl || selectedImage) + Date.now()}
                    source={{ uri: uploadedImageUrl || selectedImage! }}
                    className="w-32 h-32 rounded-full"
                    resizeMode="cover"
                  />
                )}
                <Text className="text-base font-poppins-semibold text-gray-500">
                  Preview
                </Text>
              </View>

              {!uploadedImageUrl ? (
                //Upload Button
                <View className="space-y-4" style={{ marginLeft: 15 }}>
                  <Text className="text-lg font-poppins-semibold text-gray-800">
                    Ready to upload your photo?
                  </Text>
                  <TouchableOpacity
                    className="py-3 rounded-xl"
                    onPress={() =>
                      selectedImage && uploadedImage(selectedImage)
                    }
                    disabled={isUploading}
                    style={{
                      backgroundColor: isUploading ? "#93C5FD" : "#2563EB",
                      borderRadius: 6,
                      paddingVertical: 5,
                      paddingHorizontal: 5,
                      width: 150,
                      alignItems: "center",
                    }} // bg-blue-600 with loading state
                  >
                    <Text className="text-center text-white font-poppins-semibold text-lg ">
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                //AI Features
                <View style={{ marginLeft: 20 }} className="space-y-4">
                  <Text
                    className="text-lg font-poppins-semibold text-gray-700 "
                    style={{ marginBottom: 15 }}
                  >
                    Enhance your photo with AI
                  </Text>
                  <View className="gap-4">
                    <TouchableOpacity
                      className={`flex-row items-center p-3 border border-gray-300 rounded-xl ${
                        appliedFeatures.includes("bg-remove")
                          ? "bg-purple-50 border-purple-300"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("bg-remove")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="cut" size={20} color="#7C3AED" />
                      </View>
                      <View className="flex-1 flex flex-col">
                        <Text className="text-base font-poppins-semibold text-gray-900">
                          Remove Background
                        </Text>
                        <Text className="text-gray-500 font-poppins-semibold text-sm">
                          Remove the background automatically
                        </Text>
                        {appliedFeatures.includes("bg-remove") && (
                          <View className="ml-auto mr-2 mt-1 w-6 h-6 bg-purple-600 rounded-full items-center justify-center flex self-start">
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border border-gray-200 rounded-xl ${
                        appliedFeatures.includes("relight")
                          ? "bg-yellow-50 border-yellow-300"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("relight")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="sunny" size={20} color="#F59E0B" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-poppins-semibold text-gray-900">
                          Relight
                        </Text>
                        <Text className="text-gray-500 font-poppins-semibold text-sm">
                          Improve lighting and shadows
                        </Text>
                      </View>
                      {appliedFeatures.includes("relight") && (
                        <View className="ml-auto mr-2 mt-1 w-6 h-6 bg-yellow-600 rounded-full items-center justify-center flex self-start">
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-row items-center p-3 border border-gray-200 rounded-xl ${
                        appliedFeatures.includes("quality-improve")
                          ? "bg-blue-50 border-blue-300"
                          : "border-gray-200"
                      }`}
                      onPress={() => applyAIFeature("quality-improve")}
                      disabled={isApplyingAI}
                    >
                      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="sparkles" size={20} color="#3B82F6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-poppins-semibold text-gray-900">
                          Quality Improve
                        </Text>
                        <Text className="text-gray-500 font-poppins-semibold text-sm">
                          Enhance image quality and resolution
                        </Text>
                      </View>
                      {appliedFeatures.includes("quality-improve") && (
                        <View className="ml-auto mr-2 mt-1 w-6 h-6 bg-blue-600 rounded-full items-center justify-center flex self-start">
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="flex-row items-center justify-between space-x-4 pt-0">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl border border-gray-300 bg-gray-50 active:bg-gray-100 transition-all duration-150"
                  onPress={() => {
                    setSelectedImage(null);
                    setShowAIFeatures(false);
                    setUploadedImageUrl(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    className="text-center text-gray-700 font-poppins-semibold text-base tracking-wide"
                    style={{ marginLeft: 30, marginBottom: 82 }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                {uploadedImageUrl && (
                  <TouchableOpacity
                    className="flex-1 py-3    shadow active:bg-blue-700 transition-all duration-150"
                    style={{
                      backgroundColor: "#2563EB",
                      borderRadius: 6,
                      paddingVertical: 5,
                      paddingHorizontal: 5,
                      marginEnd: 30,
                      marginBottom: 82,
                    }} // bg-blue-600
                    onPress={saveFinalImage}
                    activeOpacity={0.85}
                  >
                    <Text className="text-center text-white font-poppins-semibold text-base tracking-wide">
                      Save
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const menuItems = [
    {
      id: "orders",
      title: "My Orders",
      subtitle: "Track your orders, or view history",
      icon: "bag-outline",
      iconColor: "#2563EB",
      iconBg: "#dbeafe",
      onPress: () => {
        // Navigate to Orders Screen
        router.push("/my-orders");
      },
    },
    {
      id: "inbox",
      title: "Inbox",
      subtitle: "View your messages",
      icon: "mail-outline",
      iconColor: "#059669",
      iconBg: "#d1fae5",
      onPress: () => {
        // Navigate to Inbox Screen
        router.push("/messages");
      },
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Manage your notification",
      icon: "notifications-outline",
      iconColor: "D97706",
      iconBg: "#FEF3C7",
      onPress: () => {
        router.push("/notifications");
      },
    },
    {
      id: "shipping",
      title: "Shipping Address",
      subtitle: "Manage your delivery addresses",
      icon: "location-outline",
      iconColor: "#7C3AED",
      iconBg: "#EDE9FE",
      onPress: () => {
        router.push("/shipping");
      },
    },
    {
      id: "password",
      title: "Change Password",
      subtitle: "Update your account password",
      icon: "lock-closed-outline",
      iconColor: "#DC2626",
      iconBg: "#FEE2E2",
      onPress: () => router.push("/change-password"),
    },
    {
      id: "settings",
      title: "Account Settings",
      subtitle: "Manage your account preference",
      icon: "settings-outline",
      iconColor: "#6B7280",
      iconBg: "#F3F4F6",
      onPress: () => router.push("/settings"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 pt-12 bg-white">
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/*Header*/}
      <View
        className="bg-white px-4  border-gray-100 "
        style={{ marginTop: -16 }}
      >
        <Text className="text-2xl font-poppins-semibold text-gray-900">
          Profile
        </Text>

        <Text className="text-sm font-poppins-semibold text-gray-500">
          Welcome back, {user?.name || "User"}👋
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/*Profile Header Card*/}
          <View className="bg-white rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="relative items-center justify-center mb-6">
                <Image
                  key={profileImageUri}
                  source={{ uri: profileImageUri }}
                  className="w-20 h-20 rounded-full"
                  contentFit="cover"
                  cachePolicy="none"
                />
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -42,
                    width: 21,
                    height: 21,
                    backgroundColor: "#2563EB", // bg-blue-600
                    borderRadius: 50,
                    alignItems: "center",
                    justifyContent: "center",

                    borderColor: "#fff",
                  }}
                  activeOpacity={0.7}
                  onPress={() => setShowPhotoModal(true)}
                >
                  <Ionicons name="camera" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-poppins-semibold text-gray-900">
                  {user?.name || "User Name"}
                </Text>
                <Text className="text-gray-500 font-poppins-semibold font-poppins-medium">
                  {user?.email || "user@example.com"}
                </Text>

                <TouchableOpacity
                  className=" mt-2"
                  onPress={() => setShowPhotoModal(true)}
                >
                  <Text className="text-sm font-poppins-semibold font-poppins-medium text-blue-600">
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/*Quick Stats*/}

            <View className="flex-row gap-4">
              <View className="flex-1 bg-gray-50 rounded-xl p-4 ">
                <View className="flex-row items-center  mb-2">
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text className="text-sm font-poppins-semibold text-gray-600 ml-2">
                    Orders
                  </Text>
                </View>
                <Text className="text-xl font-poppins-semibold text-gray-900">
                  7
                </Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4 ">
                <View className="flex-row items-center  mb-2">
                  <SimpleLineIcons
                    name="user-following"
                    size={16}
                    color="#6B7280"
                  />
                  <Text className="text-sm font-poppins-semibold text-gray-600 ml-2">
                    Following
                  </Text>
                </View>
                <Text className="text-xl font-poppins-semibold text-gray-900">
                  2
                </Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4 ">
                <View className="flex-row items-center  mb-2">
                  <Ionicons name="bag-outline" size={16} color="#6B7280" />
                  <Text className="text-sm font-poppins-semibold text-gray-600 ml-2">
                    Cart
                  </Text>
                </View>
                <Text className="text-xl font-poppins-semibold text-gray-900">
                  3
                </Text>
              </View>
            </View>
          </View>
          {/*Menu Items*/}
          <View className="gap-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                style={{ marginBottom: 20 }}
                key={item.id}
                onPress={item.onPress}
                className=" p-4 bg-white rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.1)] border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
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

                  <View className="flex-1">
                    <Text className="text-lg font-poppins-semibold text-gray-900">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 font-poppins-medium text-sm">
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="rounded-2xl border border-red-200 p-4 mt-6 "
            onPress={() => {
              logOutHandler();
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center bg-red-50 rounded-2xl h-12">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="ml-2 font-poppins-semibold text-red-500 text-lg">
                Logout
              </Text>
            </View>
          </TouchableOpacity>

          {/*Bottom Spacing*/}
          <View className="h-10" />
        </View>
      </ScrollView>
      {renderPhotoModal()}
    </SafeAreaView>
  );
}
