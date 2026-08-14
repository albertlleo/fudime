import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import { signOutAction } from '../actions'
import type { User, CreatorRequest } from '@/lib/types'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
  const user = profile as User

  const { data: creatorReqRaw } = user.role === 'consumer'
    ? await supabase.from('creator_requests').select('status').eq('user_id', user.id).maybeSingle()
    : { data: null }
  const creatorRequest = creatorReqRaw as Pick<CreatorRequest, 'status'> | null

  const isAdmin = authUser.email === process.env.ADMIN_EMAIL

  function SettingRow({ href, icon, label, sublabel, accent }: {
    href: string; icon: React.ReactNode; label: string; sublabel?: string; accent?: boolean
  }) {
    return (
      <Link href={href}
        className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70"
        style={{ borderBottom: '1px solid var(--brown-100)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: accent ? '#fffbeb' : 'var(--brown-100)' }}>
            {icon}
          </div>
          <div>
            <span className="text-sm font-medium block" style={{ color: accent ? '#92400e' : 'var(--brown-900)' }}>
              {label}
            </span>
            {sublabel && (
              <span className="text-xs" style={{ color: accent ? '#d97706' : 'var(--brown-400)' }}>{sublabel}</span>
            )}
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    )
  }

  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <BackButton fallback="/perfil" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Configuración</h1>
      </div>

      {/* Cuenta */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Cuenta</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <SettingRow
            href="/perfil/editar"
            label="Editar perfil"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          />
          <SettingRow
            href="/notificaciones"
            label="Notificaciones"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Creador */}
      {user.role === 'consumer' && (
        <div className="mx-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Creador</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <Link href="/perfil/solicitar-creador"
              className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70"
              style={{
                background: creatorRequest?.status === 'pending' ? '#fffbeb' : 'transparent',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#fffbeb' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4" style={{ color: '#d97706' }}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium block" style={{ color: 'var(--brown-900)' }}>
                    Solicitar cuenta de creador
                  </span>
                  {creatorRequest?.status === 'pending' && (
                    <span className="text-xs" style={{ color: '#d97706' }}>Solicitud en revisión</span>
                  )}
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--brown-300)' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <div className="mx-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Admin</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid #fcd34d' }}>
            <SettingRow
              href="/admin"
              label="Panel Admin"
              accent
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4" style={{ color: '#d97706' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Info cuenta */}
      <div className="mx-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Información</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--brown-100)' }}>
            <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Email</span>
            <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--brown-700)' }}>{user.email}</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--brown-500)' }}>Rol</span>
            <span className="text-sm font-medium" style={{ color: 'var(--brown-700)' }}>
              {user.role === 'creator' ? 'Creador' : 'Consumidor'}
            </span>
          </div>
        </div>
      </div>

      {/* Cerrar sesión */}
      <div className="mx-5 mb-8">
        <form action={signOutAction}>
          <button type="submit"
            className="w-full font-medium rounded-2xl py-3.5 text-sm transition-colors"
            style={{ background: '#fff', border: '1.5px solid #fca5a5', color: '#dc2626' }}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
