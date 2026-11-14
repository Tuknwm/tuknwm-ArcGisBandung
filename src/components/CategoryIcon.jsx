import { CATEGORIES } from '../lib/places'

export default function CategoryIcon({ category, size = 16, className = '' }) {
  const cat = CATEGORIES[category]
  if (!cat) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`cat-icon ${className}`}
      aria-hidden="true"
      style={{ '--c': cat.color }}
    >
      <path d={cat.icon} />
    </svg>
  )
}
