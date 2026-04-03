import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { router } from "expo-router";
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

interface SignupFormData {
  name: string;
  email: string;
  password: string;
}
const signupUser = async (userData: SignupFormData) => {
  try {
    const reponse = await axios.post(
      `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/user-registration/`,
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
        throw new Error("Signup failed");
      }
    }

    throw new Error("Signup failed");
  }
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
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

  //Signup Form
  const signupForm = useForm<SignupFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const signupMutation = useMutation({
    mutationFn: signupUser,
    onSuccess: (data, variables) => {
      router.replace({
        pathname: "/signup-otp",
        params: {
          name: variables.name,
          email: variables?.email,
          password: variables.password,
        },
      });
    },
    onError: (error) => {
      showErrorToast(error?.message);
    },
  });

  const onSignupSubmit = (data: SignupFormData) => {
    // Trigger the mutation
    signupMutation.mutate(data);
  };

  const handleSignInNavigation = () => {
    router.push("/login");
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
              Create Account
            </Text>
            <Text className="text-gray-500 font-poppins text-base">
              Start exploring by creating your account
            </Text>
          </View>
          {/*Form fields*/}
          <View className="gap-6 mt-8">
            {/*Name field*/}
            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Name
              </Text>
              <Controller
                control={signupForm.control}
                name="name"
                rules={{
                  required: "name is required",
                  minLength: {
                    value: 3,
                    message: "name must be at least 3 characters",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${signupForm.formState.errors.name ? "border-red-500" : "border-gray-200"}`}
                    >
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={20}
                        color={"#9CA3AF"}
                      />
                      <TextInput
                        className="flex-1 min-w-0 ml-3 text-gray-800 font-poppins-semibold"
                        style={webInputStyle}
                        placeholder="Create your name"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!signupMutation.isPending}
                      />
                    </View>
                    {signupForm.formState.errors.name && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {signupForm.formState.errors.name.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/*Email Field*/}
            <View>
              <Text className="text-gray-800 text-base font-poppins-semibold mb-3">
                Email
              </Text>
              <Controller
                control={signupForm.control}
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
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${signupForm.formState.errors.email ? "border-red-500" : "border-gray-200"}`}
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
                        editable={!signupMutation.isPending}
                      />
                    </View>
                    {signupForm.formState.errors.email && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {signupForm.formState.errors.email.message}
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
                control={signupForm.control}
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
                      className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border ${signupForm.formState.errors.password ? "border-red-500" : "border-gray-200"}`}
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
                        editable={!signupMutation.isPending}
                      />
                      <TouchableOpacity
                        className="ml-3 shrink-0"
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={signupMutation.isPending}
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
                    {signupForm.formState.errors.password && (
                      <Text className="text-red-500 text-sm mt-2 font-poppins-semibold">
                        {signupForm.formState.errors.password.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>
          </View>

          {/*Submit Button*/}
          <TouchableOpacity
            className={`rounded-xl py-4 mt-8 ${
              signupForm.formState.isValid ? "bg-blue-600" : "bg-gray-400"
            }`}
            onPress={signupForm.handleSubmit(onSignupSubmit)}
            disabled={!signupForm.formState.isValid || signupMutation.isPending}
          >
            <Text className="text-white text-center font-poppins-semibold text-base">
              {signupMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
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
              disabled={signupMutation.isPending}
            >
              <MaterialCommunityIcons
                name="google"
                size={24}
                color={"#EA4335"}
                className="mr-3"
              />
              <Text className="text-gray-800 font-poppins-semibold text-base">
                Sign Up with Google
              </Text>
            </TouchableOpacity>

            {/*Facebook Sign In */}
            <TouchableOpacity
              className="flex-row items-center mb-4 justify-center bg-white border border-gray-200 rounded-xl py-4"
              disabled={signupMutation.isPending}
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color={"#1877F2"}
                className="mr-3"
              />
              <Text className="text-gray-800 font-poppins-semibold text-base">
                Sign Up with Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/*Switch to Sign In Link*/}
          <View className="flex-row justify-center items-center mb-8">
            <Text className="text-gray-500 font-poppins text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleSignInNavigation}
              disabled={signupMutation.isPending}
            >
              <Text className="text-blue-500 font-poppins-semibold text-sm">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
