'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function RedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.get('new') === 'true' ? '&new=true' : ''
    router.replace(`/ingresos?tab=unicos${params}`)
  }, [router, searchParams])

  return <div className="text-center py-8">Redirigiendo...</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <RedirectContent />
    </Suspense>
  )
}
