'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { api } from "@/utils/api";
import superjson from "superjson";

export function Providers({ 
  children, 
  session, 
  cookieHeader 
}: { 
  children: React.ReactNode, 
  session: any,
  cookieHeader: string
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60, // Data is fresh for 1 minute
        gcTime: 1000 * 60 * 5, // Cache for 5 minutes
        refetchOnMount: true,
      },
      mutations: {
        retry: 2,
        onError: (error) => {
          console.error('Mutation error:', error);
        },
        onSuccess: () => {
          // Invalidate and refetch all queries after any mutation
          void queryClient.invalidateQueries();
        },
      },
    },
  }));

  const [trpcClient] = useState(() => 
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          url: '/api/trpc',
          headers() {
            return {
              cookie: cookieHeader,
              'x-trpc-source': 'react',
            };
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider 
          session={session} 
          refetchInterval={5 * 60} // Refetch session every 5 minutes
          refetchOnWindowFocus={true}
        >

          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            <Toaster richColors closeButton position="top-right" />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </api.Provider>

  );
}