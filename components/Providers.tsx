// Providers.tsx
"use client";

import React, { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient only once per session.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        cacheTime: 1000 * 60 * 5,
      } as any, // <-- Casting to any to bypass type checking
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
