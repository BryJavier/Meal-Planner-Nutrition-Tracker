export default function AppLogo({ size = 32, variant = 'badge', color }) {
  const iconColor = color ?? (variant === 'badge' ? 'white' : '#34D399')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MealPlanner logo"
      role="img"
      style={{ flexShrink: 0 }}
    >
      {variant === 'badge' && (
        <rect width="32" height="32" rx="8" fill="#059669" />
      )}
      <path d="M6 18 C6 25 26 25 26 18" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 18 H26" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 18 V10" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 15 C14 13 11 10 12 8 C14 8 16 12 16 15Z" fill={iconColor} />
      <path d="M16 13 C18 11 21 8 21 7 C19 7 17 10 16 13Z" fill={iconColor} />
    </svg>
  )
}
