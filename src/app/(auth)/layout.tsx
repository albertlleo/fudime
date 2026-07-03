export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'var(--cream)' }}>
      {/* Decorative top stripe */}
      <div className="fixed top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, var(--amber) 0%, var(--terracotta) 100%)' }} />
      {children}
    </div>
  )
}
