"use client";

import React, { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// If you use devtools, you can uncomment the next line:
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * - Wraps the app with a single QueryClient instance to satisfy useQuery/useQueryClient.
 * - Keep this provider as small as possible and client-only.
 */
export default function TanstackQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}