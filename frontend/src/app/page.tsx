'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.replace('/login')
    } else {
      router.replace(authService.getRedirectPath())
    }
  }, [router])

  return null
}
