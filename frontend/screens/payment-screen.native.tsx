import React from "react";
import { StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CardField, StripeProvider } from "@stripe/stripe-react-native";

function PaymentNativeContent() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View className="flex-1 px-4 pt-8">
        <Text className="text-2xl font-poppins-bold text-gray-900 mb-2">
          Payment
        </Text>

        <Text className="text-gray-600 font-poppins-medium mb-6">
          Enter your card details to continue checkout.
        </Text>

        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-gray-700 font-poppins-medium mb-2">
            Card Details
          </Text>

          <CardField
            postalCodeEnabled={false}
            cardStyle={{
              backgroundColor: "#FFFFFF",
              textColor: "#000000",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            style={{
              width: "100%",
              height: 50,
              marginVertical: 8,
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function PaymentNativeScreen() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}>
      <PaymentNativeContent />
    </StripeProvider>
  );
}
