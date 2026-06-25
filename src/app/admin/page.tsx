import { createAdminClient } from '@/lib/supabase/admin'
import PendingCreators from './pending-creators'
import type { User } from '@/lib/types'

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('users')
    .select('*')
    .eq('role', 'creator')
    .is('validated_at', null)
    .order('created_at', { ascending: true })

  const { data: validated } = await admin
    .from('users')
    .select('id, display_name, email, validated_at, created_at')
    .eq('role', 'creator')
    .not('validated_at', 'is', null)
    .order('validated_at', { ascending: false })
    .limit(10)

  const { count: totalRecipes } = await admin
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const { count: totalUsers } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Usuarios', value: totalUsers ?? 0 },
          { label: 'Recetas publicadas', value: totalRecipes ?? 0 },
          { label: 'Creadores pendientes', value: pending?.length ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-stone-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending creators */}
      <h2 className="text-base font-bold text-stone-900 mb-3">
        Creadores pendientes de validar
        {(pending?.length ?? 0) > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
            {pending!.length}
          </span>
        )}
      </h2>

      <PendingCreators creators={(pending ?? []) as User[]} />

      {/* Recently validated */}
      {(validated?.length ?? 0) > 0 && (
        <>
          <h2 className="text-base font-bold text-stone-900 mb-3 mt-8">Validados recientemente</h2>
          <div className="bg-white rounded-2xl divide-y divide-stone-100 shadow-sm">
            {validated!.map((u: any) => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-stone-900 text-sm font-medium">{u.display_name}</p>
                  <p className="text-stone-400 text-xs">{u.email}</p>
                </div>
                <span className="text-green-600 text-xs font-medium">✓ Validado</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
