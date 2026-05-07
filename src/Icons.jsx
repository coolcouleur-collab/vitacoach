import React from 'react'

// ─── Stroke-based SVG icon set ────────────────────────────────────────────────

export function HomeIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="9,22 9,12 15,12 15,22"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ChatIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function HeartIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function RoutineIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <rect x="9" y="3" width="6" height="4" rx="1"
        stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M9 12h6M9 16h4"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function LeafIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10c0-4-3-7-8-7S4 8 4 12c0 4 4 7 8 10z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22c-2-3-2-8 0-12M12 22c2-3 2-8 0-12"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function StyleIcon({ color = '#c4b5a8', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BackIcon({ color = '#1a0a00', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M12 5l-7 7 7 7"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SparkleIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
        fill={color} fillOpacity="0.15"/>
    </svg>
  )
}

export function ChevronIcon({ color = '#c4b5a8', size = 16, direction = 'down' }) {
  const rotate = direction === 'up' ? 'rotate(180deg)' : direction === 'left' ? 'rotate(90deg)' : direction === 'right' ? 'rotate(-90deg)' : 'none'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ transform: rotate, transition: 'transform 0.25s ease' }}>
      <path d="M6 9l6 6 6-6"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PlusIcon({ color = '#FF6B35', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function CheckIcon({ color = '#34c759', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SendIcon({ color = '#fff', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
