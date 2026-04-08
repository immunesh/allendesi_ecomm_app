import { storeAccessToken } from "@/utils/axiosInstance";
import { setStoredItem } from "@/utils/storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { makeRedirectUri } from "expo-auth-session";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });

// Toast helper function
const showErrorToast = (message: string) => {
  Toast.show({
    type: "error",
    text1: message,
  });
};

const showSuccessToast = (message: string) => {
  Toast.show({
    type: "success",
    text1: message,
  });
};

interface LoginFormData {
  email: string;
  password: string;
}

const loginUser = async (userData: LoginFormData) => {
  try {
    const reponse = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/login-user/`,
      userData,
    );
    return reponse.data;
  } catch (error) {
    if (isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Network error. Please check your connection!");
      }
      //handle different status codes
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      if (status === 400 || status === 422) {
        throw new Error(errorData?.message || "Invalid input data");
      } else if (status === 409) {
        throw new Error(errorData?.message || "User already exist with this email");
      } else if (status >= 500) {
        throw new Error(
          errorData?.message || "Server error. Please try again later!",
        );
      } else {
        throw new Error("An unexpected error occurred");
      }
    }

    throw new Error("Login failed");
  }
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleWebRedirectOverride =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI;
  const googleRedirectUri =
    googleWebRedirectOverride ||
    makeRedirectUri({
      preferLocalhost: true,
    });

  // ── Social auth session hooks ──────────────────────────────────────────────
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useAuthRequest({
      webClientId: googleWebClientId,
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID &&
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID !==
          "your_google_android_client_id"
          ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
          : undefined,
      iosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID &&
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID !==
          "your_google_ios_client_id"
          ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
          : undefined,
      scopes: ["profile", "email"],
      redirectUri: googleRedirectUri,
    });

  const [fbRequest, fbResponse, promptFacebookAsync] =
    Facebook.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
      scopes: ["public_profile", "email"],
    });

  // ── Social login mutation ──────────────────────────────────────────────────
  const socialLoginMutation = useMutation({
    mutationFn: async ({
      provider,
      accessToken,
    }: {
      provider: "google" | "facebook";
      accessToken: string;
    }) => {
      try {
        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/social-login`,
          { provider, accessToken },
        );
        return res.data;
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          throw new Error(
            error.response.data?.message || "Social login failed",
          );
        }
        throw new Error("Network error. Please check your connection!");
      }
    },
    onSuccess: async (data) => {
      if (!data?.user || !data?.accessToken) {
        showErrorToast("Login response is incomplete");
        return;
      }
      showSuccessToast("Login successful!");
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar,
      };
      await setStoredItem("user", JSON.stringify(user));
      if (data.accessToken) await storeAccessToken(data.accessToken);
      if (data.refreshToken)
        await setStoredItem("refreshToken", data.refreshToken);
      router.replace("/");
    },
    onError: (error: any) => {
      showErrorToast(error?.message || "Social login failed");
    },
  });

  // Handle Google auth response
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const accessToken =
        googleResponse.authentication?.accessToken ||
        (googleResponse.params as any)?.access_token;
      if (accessToken) {
        socialLoginMutation.mutate({ provider: "google", accessToken });
      } else {
        showErrorToast("Google sign-in failed. Please try again.");
      }
      return;
    }

    if (googleResponse?.type && googleResponse.type !== "dismiss") {
      const responseParams =
        "params" in googleResponse ? (googleResponse as any).params : undefined;
      const errorMessage =
        responseParams?.error_description ||
        responseParams?.error ||
        `Google sign-in ${googleResponse.type}`;
      showErrorToast(errorMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  // Handle Facebook auth response
  useEffect(() => {
    if (fbResponse?.type === "success") {
      const accessToken =
        fbResponse.authentication?.accessToken ||
        (fbResponse.params as any)?.access_token;
      if (accessToken) {
        socialLoginMutation.mutate({ provider: "facebook", accessToken });
      } else {
        showErrorToast("Facebook sign-in failed. Please try again.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbResponse]);

  const isAnySocialPending = socialLoginMutation.isPending;

  const webInputStyle =
    Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          borderWidth: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
          padding: 0,
        } as never)
      : undefined;

  //Login Form
  const loginForm = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      if (!data?.user || !data?.accessToken) {
        showErrorToast("Login response is incomplete");
        return;
      }

      showSuccessToast("Login successful!");

      const user = {
        id: data?.user?.id,
        name: data?.user?.name,
        email: data?.user?.email,
        avatar: data?.user?.avatar,
      };
      // Store user data and token
      await setStoredItem("user", JSON.stringify(user));
      //Store user token if available
      if (data?.accessToken) {
        await storeAccessToken(data.accessToken);
      }

      if (data?.refreshToken) {
        await setStoredItem("refreshToken", data.refreshToken);
      }

      router.replace("/");
    },
    onError: (error: any) => {
      showErrorToast(error?.message);
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    //Trigger the mutation
    loginMutation.mutate(data);
  };

  const handleSignUpNavigation = () => {
    router.push("/signup");
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {/*Header*/}
          <View className="mt-8 mb-4">
            <Text className="text-3xl font-poppins-semibold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-500 font-poppins text-base">
              Sign in to Your account
            </Text>
          </View>
          {/*Form fields*/}
          <View className="gap-6 mt-8">
            {/*Email Field*/}
            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Email
              </Text>
              <Controller
                control={loginForm.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Please enter a valid email address",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${loginForm.formState.errors.email ? "border-red-500" : "border-gray-200"}`}
                    >
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={"#9CA3AF"}
                      />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loginMutation.isPending}
                      />
                    </View>
                    {loginForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {loginForm.formState.errors.email.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/*Password Field*/}
            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Password
              </Text>
              <Controller
                control={loginForm.control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${loginForm.formState.errors.password ? "border-red-500" : "border-gray-200"}`}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={"#9CA3AF"}
                      />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        editable={!loginMutation.isPending}
                      />
                      <TouchableOpacity
                        className="ml-3 shrink-0"
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color={"#9CA3AF"}
                        />
                      </TouchableOpacity>
                    </View>
                    {loginForm.formState.errors.password && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {loginForm.formState.errors.password.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/*Forgot Password*/}
            <TouchableOpacity
              className="self-end mt-2"
              onPress={() => router.push("/forgot-password")}
              disabled={loginMutation.isPending}
            >
              <Text className="text-blue-500 text-sm font-poppins-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/*Submit Button*/}
          <TouchableOpacity
            className={`rounded-xl py-4 mt-8 ${
              loginForm.formState.isValid && !loginMutation.isPending
                ? "bg-blue-600"
                : "bg-gray-400"
            }`}
            onPress={loginForm.handleSubmit(onLoginSubmit)}
            disabled={!loginForm.formState.isValid || loginMutation.isPending}
          >
            <Text className="text-white text-center font-poppins-semibold text-base">
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/*Divider*/}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500 font-poppins-semibold">
              Or using other method
            </Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>
          {/*Social Login Buttons*/}
          <View className="space-y-4 mb-8">
            {/*Google Sign In */}
            <TouchableOpacity
              className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4"
              onPress={() => {
                if (!googleWebClientId) {
                  showErrorToast("Google web client ID is missing in frontend/.env");
                  return;
                }

                if (!googleRequest) {
                  showErrorToast(
                    "Google auth is not ready yet. Please refresh and try again.",
                  );
                  return;
                }

                promptGoogleAsync().catch(() => {
                  showErrorToast("Google popup failed to open. Please try again.");
                });
              }}
              disabled={
                isAnySocialPending ||
                loginMutation.isPending
              }
            >
              <MaterialCommunityIcons
                name="google"
                size={24}
                color={"#EA4335"}
                className="mr-3"
              />
              <Text className="text-gray-800 font-poppins-semibold text-base">
                {isAnySocialPending ? "Signing in..." : "Sign in with Google"}
              </Text>
            </TouchableOpacity>

            {/*Facebook Sign In */}
            <TouchableOpacity
              className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4"
              onPress={() => promptFacebookAsync()}
              disabled={
                !fbRequest ||
                isAnySocialPending ||
                loginMutation.isPending
              }
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color={"#1877F2"}
                className="mr-3"
              />
              <Text className="text-gray-800 font-poppins-semibold text-base">
                {isAnySocialPending ? "Signing in..." : "Sign in with Facebook"}
              </Text>
            </TouchableOpacity>
          </View>

          {/*Switch to Sign Up Link*/}
          <View className="flex-row justify-center items-center mb-8">
            <Text className="text-gray-500 font-poppins text-sm">
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleSignUpNavigation}
              disabled={loginMutation.isPending}
            >
              <Text className="text-blue-500 font-poppins-semibold text-sm">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
