import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const router = useRouter();
  const webInputStyle =
    Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          borderWidth: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
          padding: 0,
        } as any)
      : undefined;
  // Forgot Password form
  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: ForgotPasswordFormData) => {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/forgot-password`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      setIsSubmitted(true);
      setSubmittedEmail(variables.email);
      setResetToken(data?.resetToken || null);
      showSuccessToast("Reset link request sent");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        showErrorToast(error.response?.data?.message || "Failed to send reset link");
        return;
      }
      showErrorToast("Failed to send reset link");
    },
  });

  const verifySmtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/verify-smtp`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      showSuccessToast(data?.message || "SMTP is configured correctly");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        showErrorToast(error.response?.data?.message || "SMTP verification failed");
        return;
      }
      showErrorToast("SMTP verification failed");
    },
  });

  const handleBackToLogin = () => {
    router.back();
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleResendEmail = () => {
    const email = forgotPasswordForm.getValues("email");
    if (email) {
      forgotPasswordMutation.mutate({ email });
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          {/*Success Icon and Message*/}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-green-100 rounded-full justify-center items-center mb-6">
              <Ionicons name="mail-outline" size={20} color={"#10B981"} />
            </View>
          </View>
          <Text className="text-2xl font-poppins-semibold text-gray-900 mb-4">
            Check Your Email
          </Text>
          <Text className="text-gray-500 font-poppins text-base text-center">
            We have sent a password reset link to {"\n"}
            <Text className="font-poppins-semibold text-gray-700">
              {submittedEmail || forgotPasswordForm.getValues("email")}
            </Text>
          </Text>
        </View>
        {/*Instructions */}
        <View className="bg-blue-50 rounded-xl p-4 mx-6 mb-8">
          <Text className="text-blue-800 font-poppins-semibold text-sm mb-2">
            What&apos;s next?
          </Text>
          <Text className="text-blue-700 font-poppins text-sm leading-5">
            1.Check your email inbox{"\n"}
            2.Click the reset link we sent you{"\n"}
            3.Create a new password {"\n"}
            4.Sign in with your new password
          </Text>
        </View>
        {/*Resend Email */}

        <TouchableOpacity
          onPress={handleResendEmail}
          className="bg-blue-600 rounded-xl py-4 items-center"
          disabled={forgotPasswordMutation.isPending}
        >
          <Text className="text-white font-poppins-semibold text-base">
            {forgotPasswordMutation.isPending ? "Sending..." : "Resend Email"}
          </Text>
        </TouchableOpacity>

        {resetToken && (
          <TouchableOpacity
            onPress={() => {
              const email = submittedEmail || forgotPasswordForm.getValues("email");
              router.push({
                pathname: "/change-password",
                params: {
                  email,
                  token: resetToken,
                },
              });
            }}
            className="bg-green-600 rounded-xl py-4 items-center mt-3"
          >
            <Text className="text-white font-poppins-semibold text-base">
              Continue To Reset Password
            </Text>
          </TouchableOpacity>
        )}

        {/*Back to Login */}

        <TouchableOpacity
          onPress={handleBackToLogin}
          className="border border-gray-300  rounded-xl py-4 items-center"
        >
          <Text className="text-gray-700  text-center text-lg font-poppins-semibold">
            Back to Login
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
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

          <View className="flex-row items-center mt-10 mb-8">
            <TouchableOpacity
              onPress={handleBackToLogin}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color={"#374151"} />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-semibold text-gray-900 ml-4">
              Forgot Password
            </Text>
          </View>
          {/*Main Content*/}

          <View className="mb-8">
            <Text className="text-3xl text-gray-900 font-poppins-bold mb-4">
              Reset Your Password
            </Text>
            <Text className="text-gray-500 font-poppins text-base mt-8 leading-6">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Text>
          </View>

          <View>
            {/*Email Field*/}
            <View className="mt-6">
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Email Address
              </Text>
              <Controller
                control={forgotPasswordForm.control}
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
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${forgotPasswordForm.formState.errors.email ? "border-red-500" : "border-gray-200"}`}
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
                      />
                    </View>
                    {forgotPasswordForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {forgotPasswordForm.formState.errors.email.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/*Submit Button*/}
            <TouchableOpacity
              className={`rounded-xl py-4 my-6 ${
                forgotPasswordForm.formState.isValid
                  ? "bg-blue-600"
                  : "bg-gray-400"
              }`}
              onPress={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
              disabled={!forgotPasswordForm.formState.isValid || forgotPasswordMutation.isPending}
            >
              <Text className="text-white text-center font-poppins-semibold text-base">
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-gray-300 rounded-xl py-3 mb-2"
              onPress={() => verifySmtpMutation.mutate()}
              disabled={verifySmtpMutation.isPending}
            >
              <Text className="text-gray-700 text-center font-poppins-semibold text-sm">
                {verifySmtpMutation.isPending ? "Checking SMTP..." : "Test SMTP Connection"}
              </Text>
            </TouchableOpacity>

            {/*Help text*/}
            <View className="rounded-xl p-4">
              <Text className="text-gray-500 font-poppins text-sm text-center">
                Remember your password?{" "}
                <Text
                  className="text-blue-600 font-poppins-semibold"
                  onPress={handleBackToLogin}
                >
                  Send Reset Link
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
