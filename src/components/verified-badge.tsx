interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Amber verified checkmark badge — Instagram-style but in FUDIME amber.
 * sm (14px): inline next to usernames in lists
 * md (18px): overlay on avatars, chef stories
 * lg (22px): creator profile header
 */
export default function VerifiedBadge({ size = 'sm', className = '' }: Props) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'
  const sw = size === 'sm' ? '1.8' : size === 'md' ? '2' : '2.2'

  return (
    <svg
      viewBox="0 0 20 20"
      className={`${dim} flex-shrink-0 ${className}`}
      fill="none"
      aria-label="Verificado"
    >
      {/* Outer white ring so the badge pops on any background */}
      <circle cx="10" cy="10" r="9.5" fill="white" opacity="0.25" />
      {/* Amber filled circle */}
      <circle cx="10" cy="10" r="9" fill="#F59E0B" />
      {/* White checkmark */}
      <path
        d="M5.5 10.5 L8.5 13.5 L14.5 7"
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
