interface LionIconProps {
  className?: string;
  size?: number;
}

export default function LionIcon({ className = "w-6 h-6", size = 24 }: LionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lion's mane */}
      <circle cx="50" cy="45" r="35" fill="currentColor" opacity="0.9" />
      <circle cx="35" cy="30" r="15" fill="currentColor" opacity="0.7" />
      <circle cx="65" cy="30" r="15" fill="currentColor" opacity="0.7" />
      <circle cx="25" cy="45" r="12" fill="currentColor" opacity="0.6" />
      <circle cx="75" cy="45" r="12" fill="currentColor" opacity="0.6" />
      <circle cx="30" cy="60" r="10" fill="currentColor" opacity="0.5" />
      <circle cx="70" cy="60" r="10" fill="currentColor" opacity="0.5" />
      
      {/* Lion's face */}
      <circle cx="50" cy="50" r="22" fill="currentColor" />
      
      {/* Lion's ears */}
      <ellipse cx="38" cy="35" rx="6" ry="8" fill="currentColor" />
      <ellipse cx="62" cy="35" rx="6" ry="8" fill="currentColor" />
      <ellipse cx="38" cy="37" rx="3" ry="5" fill="currentColor" opacity="0.6" />
      <ellipse cx="62" cy="37" rx="3" ry="5" fill="currentColor" opacity="0.6" />
      
      {/* Lion's eyes */}
      <circle cx="43" cy="47" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="57" cy="47" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="43" cy="46" r="1.5" fill="white" />
      <circle cx="57" cy="46" r="1.5" fill="white" />
      
      {/* Lion's nose */}
      <ellipse cx="50" cy="53" rx="2" ry="1.5" fill="currentColor" opacity="0.7" />
      
      {/* Lion's mouth */}
      <path d="M 48 56 Q 50 58 52 56" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      
      {/* Lion's whiskers */}
      <line x1="30" y1="50" x2="40" y2="52" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="32" y1="54" x2="42" y2="55" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="60" y1="52" x2="70" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="58" y1="55" x2="68" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}