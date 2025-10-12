'use client'

// src/app/providers.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/api/queryClient'
import { AuthProvider } from '@/lib/auth/authContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
