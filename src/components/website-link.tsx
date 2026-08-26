'use client'

export default function WebsiteLink({ url, className, style }: { url: string; className?: string; style?: React.CSSProperties }) {
  let hostname = url
  try { hostname = new URL(url).hostname.replace('www.', '') } catch {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={e => { e.preventDefault(); window.open(url, '_blank', 'noopener,noreferrer') }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
      {hostname}
    </a>
  )
}
