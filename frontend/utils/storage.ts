import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const getStoredItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(key)
        : null;
    }

    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting stored item: ${key}`, error);
    return null;
  }
};

export const setStoredItem = async (
  key: string,
  value: string,
): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }

    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error setting stored item: ${key}`, error);
  }
};

export const deleteStoredItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return;
    }

    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting stored item: ${key}`, error);
  }
};
