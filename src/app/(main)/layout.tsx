import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/bottom-nav'
import Onboarding from '@/components/onboarding'
import InstallPrompt from '@/components/install-prompt'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let notifCount = 0
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    notifCount = count ?? 0
  } catch {}

  return (
    <div className="relative h-dvh overflow-hidden">
      {children}
      <BottomNav notifCount={notifCount} />
      <Onboarding />
      <InstallPrompt />
    </div>
  )
}
