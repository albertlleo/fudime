import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/back-button'
import CommentsToggle from './comments-toggle'
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
  const isCreator = user.role === 'creator'

  function SettingRow({ href, icon, label, sublabel, accent, danger }: {
    href: string; icon: React.ReactNode; label: string; sublabel?: string; accent?: boolean; danger?: boolean
  }) {
    return (
      <Link href={href}
        className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70"
        style={{ borderBottom: '1px solid var(--brown-100)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: danger ? '#fff5f5' : accent ? '#fffbeb' : 'var(--brown-100)' }}>
            {icon}
          </div>
          <div>
            <span className="text-sm font-medium block"
              style={{ color: danger ? '#dc2626' : accent ? '#92400e' : 'var(--brown-900)' }}>
              {label}
            </span>
            {sublabel && (
              <span className="text-xs" style={{ color: danger ? '#fca5a5' : accent ? '#d97706' : 'var(--brown-400)' }}>
                {sublabel}
              </span>
            )}
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 flex-shrink-0" style={{ color: danger ? '#fca5a5' : 'var(--brown-300)' }}>
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

      {/* Permisos — solo creadores */}
      {isCreator && (
        <div className="mx-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Permisos</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--brown-100)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium block" style={{ color: 'var(--brown-900)' }}>Permitir comentarios</span>
                  <span className="text-xs" style={{ color: 'var(--brown-400)' }}>En tus publicaciones</span>
                </div>
              </div>
              <CommentsToggle initialEnabled={user.comments_enabled !== false} />
            </div>
          </div>
        </div>
      )}

      {/* Accesibilidad */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Accesibilidad</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <SettingRow
            href="/perfil/cambiar-correo"
            label="Cambiar correo electrónico"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            }
          />
          <SettingRow
            href="/perfil/cambiar-contrasena"
            label="Cambiar contraseña"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Seguridad */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Seguridad</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brown-100)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium block" style={{ color: 'var(--brown-900)' }}>Autenticación en dos pasos</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--brown-100)', color: 'var(--brown-400)' }}>
              Próximamente
            </span>
          </div>
        </div>
      </div>

      {/* Creador (solicitar) — solo consumidores */}
      {!isCreator && (
        <div className="mx-5 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Creador</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
            <Link href="/perfil/solicitar-creador"
              className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70"
              style={{ background: creatorRequest?.status === 'pending' ? '#fffbeb' : 'transparent' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brown-100)' }}>
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.8} />
                    <path d="M7.5 12l3 3 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium block" style={{ color: 'var(--brown-900)' }}>Solicitar cuenta de creador</span>
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

      {/* Privacidad y datos */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Privacidad y datos</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <SettingRow
            href="/privacidad"
            label="Políticas de FUDIME"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Centro de ayuda */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Centro de ayuda</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <SettingRow
            href="/ayuda"
            label="Centro de ayuda"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: 'var(--brown-500)' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />
        </div>
      </div>

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

      {/* Gestionar cuenta */}
      <div className="mx-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--brown-400)' }}>Gestionar cuenta</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
          <SettingRow
            href="/perfil/eliminar-cuenta"
            label="Eliminar cuenta"
            danger
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            }
          />
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
