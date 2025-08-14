import React from 'react';

interface WolfIconProps {
  className?: string;
  size?: number;
}

export const WolfIcon: React.FC<WolfIconProps> = ({ className = "", size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{
        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
        transform: 'perspective(100px) rotateX(10deg) rotateY(5deg)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Wolf head base */}
      <defs>
        <linearGradient id="wolfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
        <linearGradient id="wolfEarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>
        <linearGradient id="wolfNoseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <radialGradient id="wolfEyeGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>

      {/* Wolf head outline */}
      <ellipse cx="50" cy="45" rx="25" ry="20" fill="url(#wolfGradient)" stroke="#374151" strokeWidth="1"/>
      
      {/* Wolf ears */}
      <path d="M32 35 L25 25 L35 30 Z" fill="url(#wolfEarGradient)" stroke="#374151" strokeWidth="0.5"/>
      <path d="M68 35 L75 25 L65 30 Z" fill="url(#wolfEarGradient)" stroke="#374151" strokeWidth="0.5"/>
      
      {/* Inner ear */}
      <path d="M30 32 L27 28 L32 29 Z" fill="#4B5563"/>
      <path d="M70 32 L73 28 L68 29 Z" fill="#4B5563"/>
      
      {/* Wolf snout */}
      <ellipse cx="50" cy="52" rx="12" ry="8" fill="url(#wolfGradient)" stroke="#374151" strokeWidth="0.5"/>
      
      {/* Wolf nose */}
      <ellipse cx="50" cy="48" rx="3" ry="2" fill="url(#wolfNoseGradient)"/>
      
      {/* Wolf eyes */}
      <ellipse cx="42" cy="40" rx="4" ry="3" fill="url(#wolfEyeGradient)" stroke="#1F2937" strokeWidth="0.5"/>
      <ellipse cx="58" cy="40" rx="4" ry="3" fill="url(#wolfEyeGradient)" stroke="#1F2937" strokeWidth="0.5"/>
      
      {/* Eye pupils */}
      <ellipse cx="43" cy="40" rx="1.5" ry="2" fill="#000"/>
      <ellipse cx="57" cy="40" rx="1.5" ry="2" fill="#000"/>
      
      {/* Eye highlights */}
      <circle cx="43.5" cy="39" r="0.5" fill="#FFF" opacity="0.8"/>
      <circle cx="57.5" cy="39" r="0.5" fill="#FFF" opacity="0.8"/>
      
      {/* Wolf mouth line */}
      <path d="M50 50 Q45 55 40 52" stroke="#374151" strokeWidth="1" fill="none"/>
      <path d="M50 50 Q55 55 60 52" stroke="#374151" strokeWidth="1" fill="none"/>
      
      {/* Wolf fur texture lines */}
      <path d="M35 38 Q40 42 45 38" stroke="#4B5563" strokeWidth="0.5" fill="none" opacity="0.6"/>
      <path d="M55 38 Q60 42 65 38" stroke="#4B5563" strokeWidth="0.5" fill="none" opacity="0.6"/>
      <path d="M30 45 Q35 48 40 45" stroke="#4B5563" strokeWidth="0.5" fill="none" opacity="0.6"/>
      <path d="M60 45 Q65 48 70 45" stroke="#4B5563" strokeWidth="0.5" fill="none" opacity="0.6"/>
      
      {/* Additional facial features */}
      <path d="M50 48 L50 52" stroke="#374151" strokeWidth="0.5"/>
      
      {/* Wolf eyebrows */}
      <path d="M38 35 Q42 37 46 35" stroke="#374151" strokeWidth="0.8" fill="none"/>
      <path d="M54 35 Q58 37 62 35" stroke="#374151" strokeWidth="0.8" fill="none"/>
      
      {/* Wolf chin/jaw definition */}
      <path d="M38 55 Q50 60 62 55" stroke="#4B5563" strokeWidth="0.5" fill="none" opacity="0.7"/>
      
      {/* Add mystical glow effect for 3D depth */}
      <circle cx="50" cy="45" r="28" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="2" opacity="0.5"/>
    </svg>
  );
};

export default WolfIcon;