type IconProps = { className?: string };

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <polyline points="8 15 11 18 16 12" />
    </svg>
  );
}

export function PeopleGreetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="8" r="3" />
      <path d="M2 20c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M14.5 20c.3-2.5 2-4 4.5-4s4.2 1.5 4.5 4" />
    </svg>
  );
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2" y="7" width="20" height="11" rx="4" />
      <circle cx="8" cy="12.5" r="2.2" />
      <circle cx="16" cy="12.5" r="2.2" />
      <path d="M10.3 12.5h3.4" />
    </svg>
  );
}

export function ExcitedFaceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12.5" r="8.5" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
      <path d="M8.3 15.5a5 5 0 0 0 7.4 0" />
      <path d="M12 2.2v1.6" />
      <path d="M19.5 5l-1.1 1.1" />
      <path d="M4.5 5l1.1 1.1" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 12a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1l-3 3v-3h-1a4 4 0 0 1-4-4v-2z" />
      <path d="M6 15a4 4 0 0 1-3-3.87V9a4 4 0 0 1 4-4h5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} width={18} height={18} strokeWidth={2.2} className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} width={18} height={18} strokeWidth={2.2} className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function FriendsIcon({ className }: IconProps) {
  return (
    <svg {...base} width={30} height={30} strokeWidth={1.8} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CoupleIcon({ className }: IconProps) {
  return (
    <svg {...base} width={30} height={30} strokeWidth={1.8} className={className}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function FamilyIcon({ className }: IconProps) {
  return (
    <svg {...base} width={30} height={30} strokeWidth={1.8} className={className}>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg {...base} width={30} height={30} strokeWidth={1.8} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="8" r="2.6" />
      <path d="M2.5 20v-1.2A4.8 4.8 0 0 1 7.3 14h3.4a4.8 4.8 0 0 1 4.8 4.8V20" />
      <path d="M16.2 14.4A4.4 4.4 0 0 1 21.5 20" />
    </svg>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <svg {...base} width={20} height={20} className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} width={20} height={20} className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg {...base} width={20} height={20} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg {...base} width={17} height={17} className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...base} width={20} height={20} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function DoorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" />
      <path d="M12 3l6 2v14l-6 2" />
      <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
