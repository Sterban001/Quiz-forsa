'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        await apiClient.getCurrentUser()
        router.push('/dashboard')
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  )
}
