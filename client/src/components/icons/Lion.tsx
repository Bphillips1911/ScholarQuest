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
      {/* Outer mane layers */}
      <path d="M 20 30 Q 15 20 25 15 Q 35 10 50 12 Q 65 10 75 15 Q 85 20 80 30 Q 85 40 82 50 Q 85 60 80 70 Q 75 80 65 82 Q 50 85 35 82 Q 25 80 20 70 Q 15 60 18 50 Q 15 40 20 30" fill="currentColor" opacity="0.3"/>
      
      {/* Middle mane layer */}
      <path d="M 25 32 Q 22 25 30 22 Q 40 18 50 20 Q 60 18 70 22 Q 78 25 75 32 Q 78 42 76 50 Q 78 58 75 68 Q 70 75 60 76 Q 50 78 40 76 Q 30 75 25 68 Q 22 58 24 50 Q 22 42 25 32" fill="currentColor" opacity="0.5"/>
      
      {/* Inner mane */}
      <ellipse cx="50" cy="48" rx="22" ry="26" fill="currentColor" opacity="0.7"/>
      
      {/* Lion's head/face base */}
      <ellipse cx="50" cy="52" rx="16" ry="18" fill="currentColor"/>
      
      {/* Forehead definition */}
      <ellipse cx="50" cy="45" rx="14" ry="12" fill="currentColor" opacity="0.9"/>
      
      {/* Ear base shapes */}
      <ellipse cx="38" cy="38" rx="5" ry="7" fill="currentColor" transform="rotate(-25 38 38)"/>
      <ellipse cx="62" cy="38" rx="5" ry="7" fill="currentColor" transform="rotate(25 62 38)"/>
      
      {/* Inner ears */}
      <ellipse cx="39" cy="40" rx="2.5" ry="4" fill="currentColor" opacity="0.6" transform="rotate(-25 39 40)"/>
      <ellipse cx="61" cy="40" rx="2.5" ry="4" fill="currentColor" opacity="0.6" transform="rotate(25 61 40)"/>
      
      {/* Eye sockets/brow ridge */}
      <ellipse cx="44" cy="48" rx="4" ry="3" fill="currentColor" opacity="0.8"/>
      <ellipse cx="56" cy="48" rx="4" ry="3" fill="currentColor" opacity="0.8"/>
      
      {/* Eyes */}
      <ellipse cx="44" cy="49" rx="2.5" ry="2" fill="currentColor" opacity="0.9"/>
      <ellipse cx="56" cy="49" rx="2.5" ry="2" fill="currentColor" opacity="0.9"/>
      
      {/* Eye highlights */}
      <circle cx="45" cy="48.5" r="1" fill="white" opacity="0.8"/>
      <circle cx="57" cy="48.5" r="1" fill="white" opacity="0.8"/>
      
      {/* Muzzle area */}
      <ellipse cx="50" cy="58" rx="6" ry="8" fill="currentColor" opacity="0.9"/>
      
      {/* Nose bridge */}
      <ellipse cx="50" cy="55" rx="2" ry="4" fill="currentColor" opacity="0.8"/>
      
      {/* Nose */}
      <path d="M 48 57 Q 50 55 52 57 Q 52 59 50 60 Q 48 59 48 57" fill="currentColor" opacity="0.7"/>
      
      {/* Mouth/muzzle definition */}
      <path d="M 46 62 Q 50 65 54 62" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M 50 60 L 50 63" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
      
      {/* Chin definition */}
      <ellipse cx="50" cy="66" rx="4" ry="3" fill="currentColor" opacity="0.8"/>
      
      {/* Whisker spots */}
      <circle cx="40" cy="56" r="0.8" fill="currentColor" opacity="0.6"/>
      <circle cx="60" cy="56" r="0.8" fill="currentColor" opacity="0.6"/>
      <circle cx="38" cy="60" r="0.8" fill="currentColor" opacity="0.6"/>
      <circle cx="62" cy="60" r="0.8" fill="currentColor" opacity="0.6"/>
      
      {/* Mane texture details */}
      <path d="M 32 35 Q 28 30 35 28 Q 40 32 38 38" fill="currentColor" opacity="0.4"/>
      <path d="M 68 35 Q 72 30 65 28 Q 60 32 62 38" fill="currentColor" opacity="0.4"/>
      <path d="M 30 55 Q 25 50 32 48 Q 37 52 35 58" fill="currentColor" opacity="0.4"/>
      <path d="M 70 55 Q 75 50 68 48 Q 63 52 65 58" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}