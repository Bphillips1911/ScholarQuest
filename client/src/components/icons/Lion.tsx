interface LionIconProps {
  className?: string;
  size?: number;
}

export default function LionIcon({ className = "w-6 h-6", size = 24 }: LionIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dramatic mane outer layer */}
      <path d="M 15 45 Q 8 25 20 15 Q 30 5 45 8 Q 60 2 75 8 Q 90 5 100 15 Q 112 25 105 45 Q 115 60 110 75 Q 105 90 90 100 Q 75 110 60 105 Q 45 110 30 100 Q 15 90 10 75 Q 5 60 15 45" fill="currentColor" opacity="0.2"/>
      
      {/* Secondary mane layer */}
      <path d="M 22 48 Q 18 32 28 25 Q 38 18 52 20 Q 60 15 68 20 Q 82 18 92 25 Q 102 32 98 48 Q 102 62 98 76 Q 92 86 82 88 Q 68 92 60 88 Q 52 92 38 88 Q 28 86 22 76 Q 18 62 22 48" fill="currentColor" opacity="0.35"/>
      
      {/* Primary mane body */}
      <ellipse cx="60" cy="55" rx="32" ry="36" fill="currentColor" opacity="0.5"/>
      
      {/* Mane texture strands */}
      <path d="M 35 40 Q 30 35 38 32 Q 45 36 42 42 Q 38 45 35 40" fill="currentColor" opacity="0.3"/>
      <path d="M 85 40 Q 90 35 82 32 Q 75 36 78 42 Q 82 45 85 40" fill="currentColor" opacity="0.3"/>
      <path d="M 28 65 Q 22 60 30 58 Q 38 62 35 68 Q 30 70 28 65" fill="currentColor" opacity="0.3"/>
      <path d="M 92 65 Q 98 60 90 58 Q 82 62 85 68 Q 90 70 92 65" fill="currentColor" opacity="0.3"/>
      
      {/* Lion's main head shape */}
      <ellipse cx="60" cy="62" rx="20" ry="24" fill="currentColor"/>
      
      {/* Facial structure - cheek bones */}
      <ellipse cx="48" cy="58" rx="8" ry="12" fill="currentColor" opacity="0.9"/>
      <ellipse cx="72" cy="58" rx="8" ry="12" fill="currentColor" opacity="0.9"/>
      
      {/* Forehead prominence */}
      <ellipse cx="60" cy="50" rx="16" ry="14" fill="currentColor" opacity="0.95"/>
      
      {/* Realistic ear structure */}
      <ellipse cx="46" cy="42" rx="6" ry="9" fill="currentColor" transform="rotate(-30 46 42)"/>
      <ellipse cx="74" cy="42" rx="6" ry="9" fill="currentColor" transform="rotate(30 74 42)"/>
      
      {/* Inner ear cavities */}
      <ellipse cx="47" cy="44" rx="3" ry="5" fill="currentColor" opacity="0.4" transform="rotate(-30 47 44)"/>
      <ellipse cx="73" cy="44" rx="3" ry="5" fill="currentColor" opacity="0.4" transform="rotate(30 73 44)"/>
      
      {/* Eye socket depth */}
      <ellipse cx="53" cy="56" rx="5" ry="4" fill="currentColor" opacity="0.7"/>
      <ellipse cx="67" cy="56" rx="5" ry="4" fill="currentColor" opacity="0.7"/>
      
      {/* Realistic eyes with depth */}
      <ellipse cx="53" cy="57" rx="3.5" ry="3" fill="currentColor" opacity="0.9"/>
      <ellipse cx="67" cy="57" rx="3.5" ry="3" fill="currentColor" opacity="0.9"/>
      
      {/* Pupil definition */}
      <ellipse cx="53" cy="57" rx="2" ry="2.5" fill="currentColor"/>
      <ellipse cx="67" cy="57" rx="2" ry="2.5" fill="currentColor"/>
      
      {/* Eye shine/life */}
      <circle cx="54" cy="56" r="1.2" fill="white" opacity="0.9"/>
      <circle cx="68" cy="56" r="1.2" fill="white" opacity="0.9"/>
      
      {/* Prominent muzzle structure */}
      <ellipse cx="60" cy="68" rx="8" ry="10" fill="currentColor" opacity="0.95"/>
      
      {/* Nose bridge definition */}
      <ellipse cx="60" cy="64" rx="3" ry="6" fill="currentColor" opacity="0.8"/>
      
      {/* Realistic nose shape */}
      <path d="M 57 67 Q 60 65 63 67 Q 63 70 60 71 Q 57 70 57 67" fill="currentColor" opacity="0.6"/>
      <ellipse cx="60" cy="68" rx="1.5" ry="1" fill="currentColor" opacity="0.8"/>
      
      {/* Mouth and jaw structure */}
      <path d="M 55 74 Q 60 77 65 74" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <path d="M 60 71 L 60 75" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
      
      {/* Jaw definition */}
      <ellipse cx="60" cy="78" rx="6" ry="4" fill="currentColor" opacity="0.85"/>
      
      {/* Whisker emergence points */}
      <circle cx="47" cy="65" r="1" fill="currentColor" opacity="0.5"/>
      <circle cx="73" cy="65" r="1" fill="currentColor" opacity="0.5"/>
      <circle cx="45" cy="70" r="1" fill="currentColor" opacity="0.5"/>
      <circle cx="75" cy="70" r="1" fill="currentColor" opacity="0.5"/>
      
      {/* Additional mane wild strands for realism */}
      <path d="M 40 52 Q 35 48 42 45 Q 48 49 45 55" fill="currentColor" opacity="0.25"/>
      <path d="M 80 52 Q 85 48 78 45 Q 72 49 75 55" fill="currentColor" opacity="0.25"/>
      <path d="M 38 72 Q 32 68 40 65 Q 47 69 44 75" fill="currentColor" opacity="0.25"/>
      <path d="M 82 72 Q 88 68 80 65 Q 73 69 76 75" fill="currentColor" opacity="0.25"/>
      
      {/* Subtle facial wrinkles for character */}
      <path d="M 50 52 Q 55 50 60 52" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M 50 62 Q 55 60 60 62" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4"/>
    </svg>
  );
}