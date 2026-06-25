import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/')

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-stone-500 hover:text-stone-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="font-bold text-stone-900">FUDIME Admin</span>
        </div>
        <span className="text-stone-400 text-xs">{user.email}</span>
      </header>
      <main>{children}</main>
    </div>
  )
}
