import useUser from "@/hooks/useUser";
import { storeAccessToken } from "@/utils/axiosInstance";
import { setStoredItem } from "@/utils/storage";
import axios from "axios";
import { Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { toast } from "react-toastify";
import OnboardingScreen from "./screens/onboarding/onboarding.screen";

const parseHashParams = (hash: string) => {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const getOAuthAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  const query = window.location.search || "";

  let params = parseHashParams(hash);
  let token = params.get("access_token");

  if (!token && query) {
    params = parseHashParams(query.replace(/^[?#]/, ""));
    token = params.get("access_token");
  }

  return token;
};

export default function Index() {
  const { user } = useUser();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    const handleOAuthFromHash = async () => {
      if (typeof window === "undefined") {
        setIsProcessingOAuth(false);
        return;
      }

      const accessTokenFromGoogle = getOAuthAccessToken();

      // Google web redirect returns token in URL hash; issuer may vary by flow.
      if (!accessTokenFromGoogle) {
        setIsProcessingOAuth(false);
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/social-login`,
          {
            provider: "google",
            accessToken: accessTokenFromGoogle,
          },
        );

        const data = response.data;
        if (!data?.user || !data?.accessToken) {
          throw new Error("Login response is incomplete");
        }

        await setStoredItem("user", JSON.stringify(data.user));
        await storeAccessToken(data.accessToken);
        if (data.refreshToken) {
          await setStoredItem("refreshToken", data.refreshToken);
        }

        // Remove token hash from URL after successful processing.
        window.history.replaceState({}, document.title, window.location.pathname);
        router.replace("/(tabs)");
      } catch (error: any) {
        console.error("OAuth social login failed:", error);
        toast.error(error?.message || "Google sign-in failed");
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setIsProcessingOAuth(false);
      }
    };

    handleOAuthFromHash();
  }, []);

  if (isProcessingOAuth) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 16 }}>Signing in...</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <OnboardingScreen />;
}

