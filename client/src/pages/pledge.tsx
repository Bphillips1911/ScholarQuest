import { Card, CardContent } from "@/components/ui/card";
import { HandHeart, Shield, Star, Leaf, Mountain, Flame } from "lucide-react";

const houses = [
  { id: "franklin", name: "Johnson", icon: "🔬", color: "house-franklin", bg: "bg-house-franklin" },
  { id: "tesla", name: "Tesla", icon: "⚡", color: "house-tesla", bg: "bg-house-tesla" },
  { id: "curie", name: "Drew", icon: "🧪", color: "house-curie", bg: "bg-house-curie" },
  { id: "nobel", name: "Marshall", icon: "🎯", color: "house-nobel", bg: "bg-house-nobel" },
  { id: "lovelace", name: "West", icon: "💻", color: "house-lovelace", bg: "bg-house-lovelace" },
];

const houseValues = {
  franklin: "Discovery",
  tesla: "Excellence", 
  curie: "Progress",
  nobel: "Achievement",
  lovelace: "Innovation",
};

export default function Pledge() {
  return (
    <section data-testid="pledge-section">
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <HandHeart className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="pledge-title">House Pledge</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="pledge-subtitle">
            Our commitment to character, excellence, and community that unites all five houses.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8" data-testid="pledge-text-container">
          <div className="text-center space-y-4 text-lg leading-relaxed text-gray-800">
            <p className="font-semibold text-xl text-gray-900" data-testid="pledge-opening">
              "We, the scholars of our distinguished houses,
            </p>
            <p data-testid="pledge-line-1">pledge to uphold the values that make our community strong.</p>
            <p data-testid="pledge-line-2">
              We commit to <span className="font-semibold text-blue-600">academic excellence</span> in all our studies,
            </p>
            <p data-testid="pledge-line-3">
              to <span className="font-semibold text-green-600">consistent attendance</span> that shows our dedication,
            </p>
            <p data-testid="pledge-line-4">
              and to <span className="font-semibold text-purple-600">positive behavior</span> that reflects our character.
            </p>
            <p data-testid="pledge-line-5">Whether we stand with Franklin's discovery, Tesla's excellence,</p>
            <p data-testid="pledge-line-6">Curie's progress, Nobel's achievement, or Lovelace's innovation,</p>
            <p data-testid="pledge-line-7">we are united in our commitment to growth, respect, and service.</p>
            <p className="font-semibold text-xl text-gray-900" data-testid="pledge-closing">
              Together, we rise. Together, we succeed."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4" data-testid="house-values-grid">
          {houses.map((house) => {
            // Use direct emoji icon
            const houseBgLightClass = {
              franklin: "bg-blue-50",
              tesla: "bg-purple-50", 
              curie: "bg-red-50",
              nobel: "bg-green-50",
              lovelace: "bg-orange-50",
            }[house.id] || "bg-blue-50";

            return (
              <div key={house.id} className={`text-center p-4 ${houseBgLightClass} rounded-lg`} data-testid={`house-value-${house.id}`}>
                <div className={`w-12 h-12 ${house.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <span className="house-icon-3d text-white" data-testid={`icon-house-${house.id}`}>
                    {house.icon}
                  </span>
                </div>
                <h4 className={`font-bold ${house.color}`} data-testid={`house-value-name-${house.id}`}>
                  {house.name}
                </h4>
                <p className="text-sm text-gray-600" data-testid={`house-value-trait-${house.id}`}>
                  {houseValues[house.id as keyof typeof houseValues]}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
