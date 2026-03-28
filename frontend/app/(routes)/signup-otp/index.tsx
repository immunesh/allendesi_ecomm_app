import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { useGlobalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "react-toastify";

interface VerifyOTPData {
  name: string;
  email: string;
  password: string;
  otp: string;
}

interface ResendOTPData {
  email: string;
  name: string;
  password: string;
}

export default function SignupOtp() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();

  const { name, email, password } = useGlobalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();

  //Create refs for each input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  //Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | any;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, canResend]);

  //Start countdown when component mounts
  useEffect(() => {
    setCanResend(false);
    setCountdown(60);
  }, []);

  //Validate required parameters
  useEffect(() => {
    if (!name || !email || !password) {
      toast.error("Required signup data is missing. Please try again.");
      router.back();
    }
  }, [name, email, password, router]);

  const verifyOtp = async (data: VerifyOTPData) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/verify-user`,
        {
          otp: data.otp,
          name: data?.name,
          email: data.email,
          password: data?.password,
        },
        {
          timeout: 10000,
        },
      );
      return response.data;
    } catch (error) {
      console.error("OTP Verification Error:", error);

      if (isAxiosError(error)) {
        if (!error.response) {
          toast.error("Network error. Please check your connection!");
          return;
        }
        //handle different status codes
        const status = error?.response?.status;
        const errorData = error?.response?.data;
        if (status === 400 || status === 422) {
          toast.error(errorData?.message || "Invalid OTP or signup data");
        } else if (status === 404) {
          toast.error(errorData?.message || "OTP expired or not found");
        } else if (status === 409) {
          toast.error(
            errorData?.message || "User already exist with this email",
          );
        } else if (status === 429) {
          toast.error(
            errorData?.message || "Too many requests. Please try again later.",
          );
        } else if (status >= 500) {
          toast.error(
            errorData?.message || "Server error. Please try again later!",
          );
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
        return;
      }
    }
  };

  //API function to resend OTP

  const resendOtp = async (data: ResendOTPData) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/api/registration`,
        data,
        {
          timeout: 10000,
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      if (isAxiosError(error)) {
        if (!error.response) {
          toast.error("Network error. Please check your connection!");
          return;
        }
        const status = error.response.status;
        const errorData = error.response.data;
        if (status === 400 || status === 422) {
          toast.error(errorData?.message || "Invalid email address");
        } else if (status === 429) {
          toast.error(
            errorData?.message || "Too many requests. Please try again later.",
          );
        } else if (status >= 500) {
          toast.error(
            errorData?.message || "Server error. Please try again later!",
          );
        } else {
          toast.error(errorData?.message || "Failed to resend OTP");
        }
        return;
      }
      toast.error("An error occurred while resending OTP. Please try again.");
    }
  };

  const verifyOTPMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      toast.success(`Account created successfully for ${name}!`);
      // Navigate to next screen on success
      router.replace("/(routes)/login");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Verification Failed");
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: (data) => {
      toast.success(
        `A new OTP has been sent to ${email}. Please check your inbox.`,
      );
      //Clear current OTP and restart countdown
      setOtp(["", "", "", ""]);
      setCanResend(false);
      setCountdown(60);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Resend OTP Failed");
    },
  });

  const handleOtpChange = (value: string, index: number) => {
    //only allow single digit
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    //Auto focus next input if value is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    //handle backspace - go to previous input if current is empty
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      toast.error("Please enter a 4-digit OTP.");
      return;
    }
    if (!name || !email || !password) {
      toast.error("Required signup data is missing. Please try again.");
      return;
    }
    // Trigger the verification mutation with all signup data
    verifyOTPMutation.mutate({
      otp: otpCode,
      name: name,
      email: email,
      password: password,
    });
  };

  const handleResendOTP = () => {
    if (!canResend || resendOTPMutation.isPending) return;
    if (!email) {
      toast.error("Email address is required to resend OTP.");
      return;
    }

    //Trigger the resend mutation
    resendOTPMutation.mutate({
      email: email as string,
      name: name as string,
      password: password as string,
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  //Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  const isOTPComplete = otp.every((digit) => digit !== "");
  const isVerifying = verifyOTPMutation.isPending;
  const isResending = resendOTPMutation.isPending;

  //Format countdown timer as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 "
      >
        {/*Heaader with Back Button */}
        <View className="flex-row items-center px-6 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleGoBack}
            className="mr-4 p-2 rounded-full bg-gray-100"
            disabled={isVerifying}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-semibold text-gray-900">
            Verify OTP
          </Text>
        </View>

        <View className="flex-6 px-6">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6 ">
              <Ionicons name="shield-checkmark" size={40} color={"#2563EB"} />
            </View>

            <Text className="text-xl font-poppins-semibold text-gray-900 mb-2 text-center">
              Hi {name || "User"}! Verify Your Account
            </Text>
            <Text className="text-gray-500 font-poppins-semibold text-base text-center">
              We&apos;ve sent a 4-digit verification code to{" "}
              {email || "support@example.com"}
            </Text>
          </View>
          {/** OTP Input Fields */}
          <View className="flex-row justify-center mb-8 gap-4">
            {otp.map((digit, index) => (
              <View key={index} className="w-16 h-16">
                <TextInput
                  ref={(ref: TextInput | null): void => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`w-full h-full text-center text-2xl font-poppins-semibold border-2 rounded-xl ${digit ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                />
              </View>
            ))}
          </View>
          {/*Verify Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mb-6 ${isOTPComplete && !isVerifying ? "bg-blue-600" : "bg-gray-400"}`}
            onPress={handleVerifyOtp}
            disabled={!isOTPComplete || isVerifying}
          >
            <Text className="text-white text-center text-lg font-poppins-semibold">
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>

          {/* Resend OTP Section */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600 font-poppins-semibold">
              Didn&apos;t receive the code?
            </Text>

            {canResend ? (
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={isResending}
              >
                <Text
                  className={`font-poppins-semibold ml-2 ${isResending ? "text-gray-400" : "text-blue-600"}`}
                >
                  {isResending ? "  Sending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="font-poppins-semibold ml-2 text-gray-400">
                Resend OTP in {formatTime(countdown)}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
