import axios from "axios";
import { CustomAxiosRequestConfig } from "./axiosInstance.types";
import {
  deleteStoredItem,
  getStoredItem,
  setStoredItem,
} from "./storage";
const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URI,
  withCredentials: false, //Disable cookies for React Native
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

//Get stored access token
export const getAccessToken = async (): Promise<string | null> => {
  return getStoredItem("accessToken");
};

//Store access token
export const storeAccessToken = async (token: string) => {
  await setStoredItem("accessToken", token);
};

//Remove access token
export const removeAccessToken = async () => {
  await deleteStoredItem("accessToken");
};

const handleLogout = async () => {
  // const publicPaths = ["/login", "/signup", "/forgot-password"];
  // const currentPath = window.location.pathname;
  // if (!publicPaths.includes(currentPath)) {
  //   runRedirectToLogin();
  // }
};

//Queue failed requests while refreshing
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

//Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    //Add authorization header if token exists
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

//Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const hasAuthHeader = originalRequest.headers?.Authorization;

    //If we have an auth header and get 401, try refresh the token
    if (is401 && !isRetry && hasAuthHeader) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getStoredItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/auth/refresh-token`,
          { refreshToken },

          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        //Store new access token
        if (response.data?.accessToken) {
          await storeAccessToken(response.data.accessToken);
        }
        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        //Clear tokens and redirect to login
        await removeAccessToken();
        await deleteStoredItem("refreshToken");
        await deleteStoredItem("user");

        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
export default axiosInstance;
