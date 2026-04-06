import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Providers from "../config/providers";
import "../global.css";
import {LogBox} from "react-native";

export default function RootLayout() {
  LogBox.ignoreAllLogs();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="auto" />
      </GestureHandlerRootView> 
    );
  }

  return (
    <>
      <GestureHandlerRootView>
        <Providers>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </Providers>
      </GestureHandlerRootView>
    </>
  );
}
