interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Amber verification seal badge — 12-bump scalloped circle with white checkmark.
 * Shape mathematically derived: peaks at r=9, valleys at r=7.5, control points at r=10.756
 * so each Q bezier midpoint lands exactly on the outer peak radius.
 *
 * sm (14px): inline next to usernames
 * md (18px): overlay on avatar thumbnails
 * lg (22px): creator profile header
 */
export default function VerifiedBadge({ size = 'sm', className = '' }: Props) {
  const dim =
    size === 'sm' ? 'w-3.5 h-3.5' :
    size === 'md' ? 'w-[18px] h-[18px]' :
    'w-[22px] h-[22px]'

  return (
    <svg
      viewBox="0 0 20 20"
      className={`${dim} flex-shrink-0 ${className}`}
      fill="none"
      aria-label="Verificado"
    >
      {/* 12-bump amber seal — Q bezier through valleys, control pts at enhanced radius */}
      <path
        fill="#F59E0B"
        d="M8.059 2.755
           Q10 -0.756 11.941 2.755
           Q15.378 0.685 15.303 4.697
           Q19.315 4.622 17.245 8.059
           Q20.756 10 17.245 11.941
           Q19.315 15.378 15.303 15.303
           Q15.378 19.315 11.941 17.245
           Q10 20.756 8.059 17.245
           Q4.622 19.315 4.697 15.303
           Q0.685 15.378 2.755 11.941
           Q-0.756 10 2.755 8.059
           Q0.685 4.622 4.697 4.697
           Q4.622 0.685 8.059 2.755Z"
      />
      {/* Bold white checkmark */}
      <path
        d="M5 11 L8.5 14 L15 6.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
