'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GastosUnicosRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('tab', 'unicos')
    if (searchParams.get('new') === 'true') {
      params.set('new', 'true')
    }
    router.replace(`/gastos?${params.toString()}`)
  }, [router, searchParams])

  return <div className="text-center py-8">Redirigiendo...</div>
}

export default function GastosUnicosRedirect() {
  return (
    <Suspense fallback={<div className="text-center py-8">Redirigiendo...</div>}>
      <GastosUnicosRedirectContent />
    </Suspense>
  )
}
