import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
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

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { email, token } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();

  const isResetMode = Boolean(email && token);

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

  const form = useForm<ChangePasswordFormData>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await axiosInstance.post(
        "/auth/api/change-password",
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      showSuccessToast("Password changed successfully");
      form.reset();
      router.back();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        showErrorToast(error.response?.data?.message || "Failed to change password");
        return;
      }
      showErrorToast("Failed to change password");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string; token: string; newPassword: string }) => {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/reset-password`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      showSuccessToast("Password reset successfully");
      form.reset();
      router.replace("/login");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        showErrorToast(error.response?.data?.message || "Failed to reset password");
        return;
      }
      showErrorToast("Failed to reset password");
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      showErrorToast("New password and confirm password must match");
      return;
    }

    if (!isResetMode && data.currentPassword === data.newPassword) {
      showErrorToast("New password must be different from current password");
      return;
    }

    if (isResetMode) {
      resetPasswordMutation.mutate({
        email: String(email),
        token: String(token),
        newPassword: data.newPassword,
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const isSubmitting =
    changePasswordMutation.isPending || resetPasswordMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center mt-10 mb-8">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-semibold text-gray-900 ml-4">
              {isResetMode ? "Reset Password" : "Change Password"}
            </Text>
          </View>

          <View className="mb-8">
            <Text className="text-3xl text-gray-900 font-poppins-bold mb-4">
              {isResetMode ? "Create New Password" : "Update Password"}
            </Text>
            <Text className="text-gray-500 font-poppins text-base mt-2 leading-6">
              {isResetMode
                ? "Set a new password for your account."
                : "Enter your current password and choose a new secure password."}
            </Text>
          </View>

          <View className="gap-6">
            {!isResetMode && (
            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Current Password
              </Text>
              <Controller
                control={form.control}
                name="currentPassword"
                rules={{ required: "Current password is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${form.formState.errors.currentPassword ? "border-red-500" : "border-gray-200"}`}
                    >
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Enter current password"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showCurrent}
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        className="ml-3 shrink-0"
                        onPress={() => setShowCurrent(!showCurrent)}
                      >
                        <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    {form.formState.errors.currentPassword && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {form.formState.errors.currentPassword.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>
            )}

            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                New Password
              </Text>
              <Controller
                control={form.control}
                name="newPassword"
                rules={{
                  required: "New password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${form.formState.errors.newPassword ? "border-red-500" : "border-gray-200"}`}
                    >
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Enter new password"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showNew}
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        className="ml-3 shrink-0"
                        onPress={() => setShowNew(!showNew)}
                      >
                        <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    {form.formState.errors.newPassword && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {form.formState.errors.newPassword.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Confirm Password
              </Text>
              <Controller
                control={form.control}
                name="confirmPassword"
                rules={{ required: "Please confirm your new password" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${form.formState.errors.confirmPassword ? "border-red-500" : "border-gray-200"}`}
                    >
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Confirm new password"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirm}
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        className="ml-3 shrink-0"
                        onPress={() => setShowConfirm(!showConfirm)}
                      >
                        <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    {form.formState.errors.confirmPassword && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {form.formState.errors.confirmPassword.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 mb-8 ${form.formState.isValid ? "bg-blue-600" : "bg-gray-400"}`}
              onPress={form.handleSubmit(onSubmit)}
              disabled={!form.formState.isValid || isSubmitting}
            >
              <Text className="text-white text-center font-poppins-semibold text-base">
                {isSubmitting
                  ? "Updating..."
                  : isResetMode
                    ? "Reset Password"
                    : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
