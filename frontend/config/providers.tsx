import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import Toast from "react-native-toast-message";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toast position="bottom" />
    </QueryClientProvider>
  );
}
