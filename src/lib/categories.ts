export const CATEGORIES = [
  'Aperitivos', 'Entrantes', 'Ensaladas', 'Cremas y sopas', 'Platos de cuchara',
  'Pasta', 'Arroces', 'Verduras', 'Carne y aves', 'Pescado y marisco',
  'Plant Based', 'Huevos y tortillas', 'Panadería', 'Masas y hojaldres',
  'Comida rápida', 'Postres y dulces', 'Salsas y aliños', 'Bebidas',
] as const

export const CAT_EMOJIS: Record<string, string> = {
  'aperitivos': '🥨', 'entrantes': '🥗', 'ensaladas': '🥙', 'cremas y sopas': '🍲',
  'platos de cuchara': '🫕', 'pasta': '🍝', 'arroces': '🍚', 'verduras': '🥦',
  'carne y aves': '🍗', 'pescado y marisco': '🐟', 'plant based': '🌿',
  'huevos y tortillas': '🍳', 'panadería': '🍞', 'masas y hojaldres': '🥐',
  'comida rápida': '🍔', 'postres y dulces': '🍰', 'salsas y aliños': '🫙', 'bebidas': '🥤',
}

export const DIETS = [
  { key: 'vegana', label: 'Vegana', emoji: '🌱' },
  { key: 'vegetariana', label: 'Vegetariana', emoji: '🥕' },
  { key: 'sin gluten', label: 'Sin gluten', emoji: '🌾' },
  { key: 'sin lactosa', label: 'Sin lactosa', emoji: '🥛' },
]

export const TIMES = [
  { key: 'menos-15', label: 'Menos de 15 min', emoji: '⚡' },
  { key: '15-30', label: '15–30 min', emoji: '🕐' },
  { key: '30-60', label: '30–60 min', emoji: '⏱️' },
  { key: 'mas-1h', label: 'Más de 1 hora', emoji: '🍳' },
]

// Labels with >14 chars that wrap to 2 lines in a 2-col mobile grid
export function isLongLabel(label: string): boolean {
  return label.length > 14
}
