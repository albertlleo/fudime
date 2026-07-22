import { createAdminClient } from '@/lib/supabase/admin'
import PendingCreators from './pending-creators'
import AllUsers from './all-users'

export default async function AdminPage() {
  const admin = createAdminClient()

  const [
    { data: pendingRequests },
    { data: allUsers },
    { count: totalRecipes },
    { count: totalUsers },
  ] = await Promise.all([
    admin.from('creator_requests')
      .select('*, users(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin.from('users').select('*').order('created_at', { ascending: false }).limit(50),
    admin.from('recipes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('users').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Usuarios', value: totalUsers ?? 0 },
          { label: 'Recetas publicadas', value: totalRecipes ?? 0 },
          { label: 'Solicitudes pendientes', value: pendingRequests?.length ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-stone-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending creator requests */}
      <h2 className="text-base font-bold text-stone-900 mb-3">
        Solicitudes de creador pendientes
        {(pendingRequests?.length ?? 0) > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
            {pendingRequests!.length}
          </span>
        )}
      </h2>
      <PendingCreators requests={(pendingRequests ?? []) as any[]} />

      {/* All users */}
      <h2 className="text-base font-bold text-stone-900 mb-3 mt-8">Todos los usuarios</h2>
      <AllUsers users={(allUsers ?? []) as any[]} />
    </div>
  )
}
