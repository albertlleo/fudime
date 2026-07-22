import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BackButton from '@/components/back-button'
import CreatorRequestForm from './request-form'
import type { CreatorRequest } from '@/lib/types'

export default async function SolicitarCreadorPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single()
  if (profile?.role === 'creator') redirect('/perfil')

  const { data: existingRequest } = await supabase
    .from('creator_requests')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const request = existingRequest as CreatorRequest | null

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5 flex items-center gap-3">
        <BackButton fallback="/perfil" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Solicitar cuenta creador</h1>
      </div>

      <div className="px-5">
        {request?.status === 'pending' ? (
          <div className="rounded-3xl p-6 text-center" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <span className="text-4xl block mb-3">⏳</span>
            <h2 className="font-black text-lg mb-2" style={{ color: 'var(--brown-900)' }}>Solicitud enviada</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>
              Estamos revisando tu solicitud. Te notificaremos en cuanto esté aprobada.
            </p>
          </div>
        ) : request?.status === 'rejected' ? (
          <div>
            <div className="rounded-3xl p-4 mb-5" style={{ background: '#fff5f5', border: '1.5px solid #fca5a5' }}>
              <p className="text-sm" style={{ color: '#991b1b' }}>
                Tu solicitud anterior fue rechazada. Puedes enviar una nueva con más información.
              </p>
            </div>
            <CreatorRequestForm />
          </div>
        ) : (
          <CreatorRequestForm />
        )}
      </div>
    </div>
  )
}
