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

// ─── New icons ────────────────────────────────────────────────────────────────

export function WaterIcon({ color = '#38bdf8', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0c0-4.5-7-12-7-12z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.15"/>
    </svg>
  )
}

export function MoodIcon({ color = '#fbbf24', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SadIcon({ color = '#6b7280', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function NeutralIcon({ color = '#9ca3af', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <line x1="8" y1="15" x2="16" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function HappyIcon({ color = '#34c759', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <path d="M8 13s1.5 3 4 3 4-3 4-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function LightbulbIcon({ color = '#FF9A3C', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M10 21v-2a7 7 0 01-3-5.7A7 7 0 0112 5a7 7 0 015 12.3V21"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BrainIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9.5 2A2.5 2.5 0 007 4.5v.5A2.5 2.5 0 004.5 7.5a2.5 2.5 0 00.5 5 2.5 2.5 0 002.5 3h1"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5 2A2.5 2.5 0 0117 4.5v.5a2.5 2.5 0 012.5 2.5 2.5 2.5 0 01-.5 5 2.5 2.5 0 01-2.5 3h-1"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2v20M9 8h6M9 12h6M9 16h6"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function FlashIcon({ color = '#fbbf24', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.2"/>
    </svg>
  )
}

export function FireIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 14.5A4.5 4.5 0 0012 19a4.5 4.5 0 004.5-4.5c0-1.5-.5-3-1.5-4L12 8l-3 2.5c-1 1-1.5 2.5-0.5 4z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.15"/>
      <path d="M12 8c0-2-1-4-1-6 2 1 5 4 5 8"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function MoonIcon({ color = '#a78bfa', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.15"/>
    </svg>
  )
}

export function SunIcon({ color = '#fbbf24', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function BellIcon({ color = '#34c759', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BellOffIcon({ color = '#9ca3af', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function TargetIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.3"/>
    </svg>
  )
}

export function StarIcon({ color = '#fbbf24', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.3"/>
    </svg>
  )
}

export function DiamondIcon({ color = '#38bdf8', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,9 12,22 2,9"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.15"/>
      <polygon points="12,2 22,9 2,9" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}

export function CalendarIcon({ color = '#38bdf8', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2"/>
    </svg>
  )
}

export function FoodIcon({ color = '#34c759', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PillIcon({ color = '#a78bfa', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M10.5 20.5L3.5 13.5a5 5 0 017.07-7.07l7 7a5 5 0 01-7.07 7.07z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color} fillOpacity="0.1"/>
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function MuscleIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.5 9.5c-.83-.83-2-.83-3 0l-4 4c-1 1-1 2.17 0 3s2.17 1 3 0l1.5-1.5"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 14.5c.83.83 2 .83 3 0l4-4c1-1 1-2.17 0-3s-2.17-1-3 0L12 9"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 4l-1.5 1.5M4 20l1.5-1.5M20 20l-1.5-1.5M4 4l1.5 1.5"
        stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function RunIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="13" cy="4" r="2" stroke={color} strokeWidth="2"/>
      <path d="M7 22l3-6 3 3 3-4 3 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 12l2-4 4 1 2-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function MeditateIcon({ color = '#a78bfa', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" stroke={color} strokeWidth="2"/>
      <path d="M6 11l2 2 4-4 4 4 2-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 19c1.5-2 4-3 8-3s6.5 1 8 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function ClockIcon({ color = '#9ca3af', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
      <polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function LoadingIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/>
    </svg>
  )
}

export function WeatherIcon({ color = '#fbbf24', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2"/>
      <path d="M5 17a4 4 0 018 0" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 17a4 4 0 018 0" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 19h18" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function PhoneIcon({ color = '#38bdf8', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke={color} strokeWidth="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export function RefreshIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="1,4 1,10 7,10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function GiftIcon({ color = '#FF6B35', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="20,12 20,22 4,22 4,12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="7" width="20" height="5" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <line x1="12" y1="22" x2="12" y2="7" stroke={color} strokeWidth="2"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
