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
    <div className="min-h-dvh pb-16 overflow-y-auto">
      <div className="px-4 pt-12 pb-5 flex items-center gap-3">
        <Link
          href="/perfil"
          className="w-9 h-9 flex-shrink-0 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-600">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Editar perfil</h1>
      </div>

      <EditForm user={user} />
    </div>
  )
}
