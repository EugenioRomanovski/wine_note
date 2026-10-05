import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function PersonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
    </Svg>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20s-7.2-4.4-8.8-9.3C2.2 7.6 4.3 5 7.1 5c1.9 0 3.4 1 4.9 2.7C13.5 6 15 5 16.9 5c2.8 0 4.9 2.6 3.9 5.7C19.2 15.6 12 20 12 20z" />
    </Svg>
  )
}

export function BrokenHeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20s-7.2-4.4-8.8-9.3C2.2 7.6 4.3 5 7.1 5c1.9 0 3.4 1 4.9 2.7C13.5 6 15 5 16.9 5c2.8 0 4.9 2.6 3.9 5.7C19.2 15.6 12 20 12 20z" />
      <path d="M12 7.5 10.5 10.5l2.5 2-2 3.5" />
    </Svg>
  )
}

export function GlassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 3h9l-.7 6.2a4.3 4.3 0 0 1-7.6 0L7.5 3z" />
      <path d="M7.9 6.5h8.2" />
      <path d="M12 13.5V20" />
      <path d="M8.5 20.5h7" />
    </Svg>
  )
}

export function ThumbUpIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={(size * 15) / 16}
      viewBox="0 0 16 15"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M1.00065 5.78889H3.96214V13.1062H1.00065V5.78889Z" />
      <path d="M3.96214 5.78889H5.44288L7.3467 3.75632L8.03982 1.75831C8.30894 0.982549 9.29126 0.746615 9.88334 1.31553L10.2704 1.68749C10.5562 1.96209 10.6766 2.36674 10.5873 2.75288L9.88511 5.78889H13.4973C14.4628 5.78889 15.1772 6.68735 14.9597 7.62807L13.8944 12.2341C13.7764 12.7446 13.3216 13.1062 12.7976 13.1062H3.96214V5.78889Z" />
    </svg>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6.5-5.6-6.5-10.3a6.5 6.5 0 1 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </Svg>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5h2.7l1.6-2.4h7.4l1.6 2.4H20a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </Svg>
  )
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4.5 18 4.8-4.8a1.5 1.5 0 0 1 2.1 0l8.1 6.3" />
      <path d="m14.5 15.5 1.9-1.9a1.5 1.5 0 0 1 2.1 0l2 2" />
    </Svg>
  )
}

export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6.5C10.5 5 8.3 4.5 5.5 4.5c-.7 0-1.3.05-2 .15v14.3c.7-.1 1.3-.15 2-.15 2.8 0 5 .5 6.5 2 1.5-1.5 3.7-2 6.5-2 .7 0 1.3.05 2 .15V4.65c-.7-.1-1.3-.15-2-.15-2.8 0-5 .5-6.5 2z" />
      <path d="M12 6.5v14.3" />
    </Svg>
  )
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 4.5 11.6 8.9 16 10.5l-4.4 1.6L10 16.5 8.4 12.1 4 10.5l4.4-1.6L10 4.5z" />
      <path d="M17.5 13.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" />
      <path d="M18 4l.6 1.6 1.6.6-1.6.6L18 8.4l-.6-1.6-1.6-.6 1.6-.6L18 4z" />
    </Svg>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 4.5 19.5 8.5 8.5 19.5l-5 1.5 1.5-5L15.5 4.5z" />
      <path d="M13.5 6.5l4 4" />
    </Svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </Svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v10.5" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </Svg>
  )
}

export function CloudIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 8.7 4.25 4.25 0 0 0 7 18.5z" />
    </Svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V7.7a3.5 3.5 0 0 1 7 0v2.8" />
      <circle cx="12" cy="15" r="1.2" />
    </Svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </Svg>
  )
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 14.5 6-6 6 6" />
    </Svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function GridViewIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Svg>
  )
}

export function ListViewIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 6h11M8.5 12h11M8.5 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function HistoryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" />
      <path d="M4.5 17.5v-4h4" />
      <path d="M12 8.5V12l2.5 2" />
    </Svg>
  )
}
