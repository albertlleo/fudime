export function getVerifiedBadgeColor(followers: number): string {
  if (followers >= 1_000_000) return '#eab308' // oro
  if (followers >= 500_000)   return '#f97316' // naranja
  if (followers >= 250_000)   return '#a855f7' // morado
  if (followers >= 100_000)   return '#22c55e' // verde
  if (followers >= 10_000)    return '#3b82f6' // azul
  return '#9ca3af'                             // gris
}
