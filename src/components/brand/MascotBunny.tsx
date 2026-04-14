import { cn } from '@/utils/cn'

type MascotBunnyProps = {
  className?: string
  /** Accessible label; defaults to product mascot description */
  'aria-label'?: string
}

/**
 * Brand mascot: soft white bunny holding a pink tulip (SVG, scalable, on-brand).
 */
export function MascotBunny({
  className,
  'aria-label': ariaLabel = 'Conejito Bloomora con un tulipán rosado',
}: MascotBunnyProps) {
  return (
    <svg
      viewBox="0 0 200 220"
      role="img"
      aria-label={ariaLabel}
      className={cn('drop-shadow-[0_20px_40px_rgba(124,107,181,0.22)]', className)}
    >
      <defs>
        <radialGradient id="bunny-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f4b8d0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f4b8d0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bunny-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f0fb" />
        </linearGradient>
        <linearGradient id="tulip-petal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdeef4" />
          <stop offset="50%" stopColor="#f4b8d0" />
          <stop offset="100%" stopColor="#e89bb8" />
        </linearGradient>
      </defs>
      {/* ears */}
      <ellipse cx="78" cy="58" rx="18" ry="44" fill="url(#bunny-body)" />
      <ellipse cx="122" cy="58" rx="18" ry="44" fill="url(#bunny-body)" />
      <ellipse cx="78" cy="62" rx="8" ry="28" fill="#fdeef4" opacity="0.9" />
      <ellipse cx="122" cy="62" rx="8" ry="28" fill="#fdeef4" opacity="0.9" />
      {/* head + body */}
      <ellipse cx="100" cy="108" rx="52" ry="48" fill="url(#bunny-body)" />
      <ellipse cx="100" cy="168" rx="46" ry="40" fill="url(#bunny-body)" />
      {/* cheeks */}
      <ellipse cx="72" cy="118" rx="14" ry="10" fill="url(#bunny-cheek)" />
      <ellipse cx="128" cy="118" rx="14" ry="10" fill="url(#bunny-cheek)" />
      {/* eyes */}
      <ellipse cx="86" cy="102" rx="10" ry="14" fill="#3b2f55" />
      <ellipse cx="114" cy="102" rx="10" ry="14" fill="#3b2f55" />
      <ellipse cx="88" cy="98" rx="3.5" ry="4" fill="#ffffff" />
      <ellipse cx="116" cy="98" rx="3.5" ry="4" fill="#ffffff" />
      {/* nose */}
      <ellipse cx="100" cy="122" rx="6" ry="5" fill="#e89bb8" />
      {/* tulip stem in paw */}
      <path
        d="M138 150 Q150 120 148 92"
        stroke="#7c6bb5"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* tulip */}
      <g transform="translate(132, 72)">
        <path
          d="M16 36c-8-10-8-22 0-26 6 4 10 14 4 24 6-2 12-1 14 4-4 8-12 10-18 6z"
          fill="url(#tulip-petal)"
        />
        <ellipse cx="12" cy="14" rx="9" ry="12" fill="#f4b8d0" opacity="0.95" />
        <ellipse cx="22" cy="15" rx="8" ry="11" fill="#e89bb8" opacity="0.9" />
      </g>
      {/* paws hint */}
      <ellipse cx="128" cy="158" rx="14" ry="12" fill="#f3f0fb" opacity="0.9" />
    </svg>
  )
}
