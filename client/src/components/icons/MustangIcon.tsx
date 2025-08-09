import mustangImagePath from "@assets/_BHSA Mustang 1_1754780382943.png";

interface MustangIconProps {
  className?: string;
  size?: number;
}

export default function MustangIcon({ className = "w-6 h-6", size = 24 }: MustangIconProps) {
  console.log("MustangIcon rendering with path:", mustangImagePath);
  return (
    <div className={className} style={{ width: size, height: size }}>
      <img 
        src={mustangImagePath}
        alt="BHSA Mustang"
        className="w-full h-full object-contain"
        style={{ width: '100%', height: '100%' }}
        onLoad={() => console.log("Mustang image loaded successfully")}
        onError={(e) => console.error("Mustang image failed to load:", e)}
      />
    </div>
  );
}