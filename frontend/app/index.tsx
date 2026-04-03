import useUser from "@/hooks/useUser";
import { storeAccessToken } from "@/utils/axiosInstance";
import { setStoredItem } from "@/utils/storage";
import { Redirect } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import OnboardingScreen from "./screens/onboarding/onboarding.screen";

export default function Index() {
  const { user } = useUser();

  // Show loading state while checking user authentication
  if (user === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // If user is authenticated, redirect to home tabs
  if (user) {
    return <Redirect href="/" />;
  }

  // Otherwise show onboarding
  return <OnboardingScreen />;
}

