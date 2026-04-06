import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function PaymentWebScreen() {
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string | undefined;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-poppins-bold text-gray-900 text-center mb-3">
          Payment Is App-Only
        </Text>

        <Text className="text-gray-600 font-poppins-medium text-center mb-8">
          Card payment is currently supported in the mobile app. Please continue checkout on Android or iOS.
        </Text>

        {sessionId ? (
          <Text className="text-gray-500 font-poppins-medium text-center mb-6">
            Session: {sessionId}
          </Text>
        ) : null}

        <View className="w-full gap-3">
          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-poppins-semibold text-center">
              Go Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 py-4 rounded-xl"
            onPress={() => router.replace("/")}
          >
            <Text className="text-gray-800 font-poppins-semibold text-center">
              Go To Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
