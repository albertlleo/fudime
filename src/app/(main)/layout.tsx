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
  let isCreator = false
  try {
    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single(),
    ])
    notifCount = count ?? 0
    isCreator = profile?.role === 'creator'
  } catch {}

  return (
    <div className="relative">
      {/* Desktop: push content right of sidebar, center in remaining space */}
      <div className="lg:pl-[72px] lg:flex lg:justify-center">
        <div className="w-full lg:max-w-[500px]">
          {children}
        </div>
      </div>
      <BottomNav notifCount={notifCount} isCreator={isCreator} />
      <Onboarding />
      <InstallPrompt />
    </div>
  )
}
