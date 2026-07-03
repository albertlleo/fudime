import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EditForm from './edit-form'
import type { User } from '@/lib/types'

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser!.id)
    .single()

  const user = profile as User

  return (
    <div className="min-h-dvh pb-20 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-5 flex items-center gap-3">
        <Link href="/perfil"
          className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--brown-100)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5" style={{ color: 'var(--brown-700)' }}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Editar perfil</h1>
      </div>

      <EditForm user={user} />
    </div>
  )
}
