import mustangImagePath from "@assets/_BHSA Mustang 1_1754780382943.png";

interface MustangIconProps {
  className?: string;
  size?: number;
}

export default function MustangIcon({ className = "w-6 h-6", size = 24 }: MustangIconProps) {
  return (
    <img 
      src={mustangImagePath}
      alt="BHSA Mustang"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}