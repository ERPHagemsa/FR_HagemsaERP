"use client"

import * as React from "react"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"

function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function ApiQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(crearQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
