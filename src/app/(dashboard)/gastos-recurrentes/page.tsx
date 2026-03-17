'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GastosRecurrentesRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', 'recurrentes')
    if (searchParams.get('new') === 'true') {
      params.set('new', 'true')
    }
    router.replace(`/gastos?${params.toString()}`)
  }, [router, searchParams])

  return <div className="text-center py-8">Redirigiendo...</div>
}

export default function GastosRecurrentesRedirect() {
  return (
    <Suspense fallback={<div className="text-center py-8">Redirigiendo...</div>}>
      <GastosRecurrentesRedirectContent />
    </Suspense>
  )
}
