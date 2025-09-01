import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Heart, 
  Clock, 
  Star, 
  AlertTriangle,
  BookOpen,
  Users,
  Target
} from "lucide-react";

export interface PBISCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  subcategories: PBISSubcategory[];
}

export interface PBISSubcategory {
  id: string;
  name: string;
  points: number;
  description: string;
}

// PBIS Recognition Categories based on the system shown in the screenshot
export const pbisCategories: PBISCategory[] = [
  {
    id: "attendance",
    name: "Attendance",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-blue-500",
    subcategories: [
      { id: "perfect_week", name: "Perfect Attendance (1 Week)", points: 2, description: "No tardies or absences for one full week" },
      { id: "perfect_month", name: "Perfect Attendance (1 Month)", points: 5, description: "No tardies or absences for one full month" },
      { id: "on_time", name: "On Time to Class", points: 1, description: "Consistently arrives to class on time" },
      { id: "early_arrival", name: "Early to School", points: 1, description: "Arrives to school early and ready to learn" }
    ]
  },
  {
    id: "behavior",
    name: "Behavior",
    icon: <Heart className="h-4 w-4" />,
    color: "bg-green-500",
    subcategories: [
      { id: "helping_others", name: "Helping Others", points: 2, description: "Shows kindness by helping classmates or teachers" },
      { id: "respectful_communication", name: "Respectful Communication", points: 2, description: "Uses appropriate language and tone with others" },
      { id: "following_directions", name: "Following Directions", points: 1, description: "Listens and follows instructions the first time" },
      { id: "positive_attitude", name: "Positive Attitude", points: 2, description: "Maintains optimistic outlook and encourages others" },
      { id: "conflict_resolution", name: "Conflict Resolution", points: 3, description: "Handles disagreements appropriately and peacefully" }
    ]
  },
  {
    id: "academic",
    name: "Academic",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "bg-purple-500",
    subcategories: [
      { id: "assignment_completed", name: "Assignment Completed on Time", points: 1, description: "Submits all work by the due date" },
      { id: "quality_work", name: "Quality Work Submitted", points: 2, description: "Shows effort and attention to detail in assignments" },
      { id: "class_participation", name: "Active Class Participation", points: 2, description: "Engages in discussions and asks thoughtful questions" },
      { id: "academic_improvement", name: "Academic Improvement", points: 3, description: "Shows measurable progress in academic performance" },
      { id: "extra_credit", name: "Extra Credit Completed", points: 1, description: "Goes above and beyond with additional learning" }
    ]
  },
  {
    id: "universal_positive",
    name: "Universal Positive Characteristics",
    icon: <Star className="h-4 w-4" />,
    color: "bg-yellow-500",
    subcategories: [
      { id: "leadership", name: "Leadership", points: 3, description: "Takes initiative and guides others positively" },
      { id: "responsibility", name: "Responsibility", points: 2, description: "Takes ownership of actions and duties" },
      { id: "perseverance", name: "Perseverance", points: 3, description: "Continues trying despite challenges" },
      { id: "creativity", name: "Creativity", points: 2, description: "Shows innovative thinking and original ideas" },
      { id: "school_pride", name: "School Pride", points: 2, description: "Represents the school positively" }
    ]
  },
  {
    id: "universal_negative",
    name: "Universal Negative Characteristics",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-500",
    subcategories: [
      { id: "disruptive_behavior", name: "Disruptive Behavior", points: -2, description: "Interrupts learning environment" },
      { id: "disrespectful_language", name: "Disrespectful Language", points: -3, description: "Uses inappropriate or hurtful words" },
      { id: "not_following_directions", name: "Not Following Directions", points: -1, description: "Ignores or refuses to follow instructions" },
      { id: "tardiness", name: "Tardiness", points: -1, description: "Arrives late to class or school" },
      { id: "incomplete_work", name: "Incomplete Work", points: -1, description: "Fails to complete assignments" },
      { id: "inappropriate_behavior", name: "Inappropriate Behavior", points: -2, description: "Acts in ways that violate school expectations" }
    ]
  }
];

interface PBISCategorySelectorProps {
  selectedCategory: string;
  selectedSubcategory: string;
  onCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string, points: number) => void;
  onReasonChange: (reason: string) => void;
  customReason: string;
}

export function PBISCategorySelector({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  onReasonChange,
  customReason
}: PBISCategorySelectorProps) {
  const [showCustomReason, setShowCustomReason] = useState(false);

  const selectedCategoryData = pbisCategories.find(cat => cat.id === selectedCategory);
  const selectedSubcategoryData = selectedCategoryData?.subcategories.find(sub => sub.id === selectedSubcategory);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Recognition Category
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pbisCategories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full text-white ${category.color}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-500">
                      {category.subcategories.length} options
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subcategory Selection */}
      {selectedCategory && selectedCategoryData && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Specific Recognition
          </label>
          <div className="space-y-2">
            {selectedCategoryData.subcategories.map((subcategory) => (
              <Card 
                key={subcategory.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  selectedSubcategory === subcategory.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSubcategorySelect(subcategory.id, subcategory.points)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{subcategory.name}</h4>
                        <Badge 
                          variant={subcategory.points > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {subcategory.points > 0 ? '+' : ''}{subcategory.points} {Math.abs(subcategory.points) === 1 ? 'point' : 'points'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{subcategory.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Reason Option */}
      {selectedSubcategory && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <label className="text-sm font-medium text-gray-700">
              Additional Details (Optional)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomReason(!showCustomReason)}
            >
              {showCustomReason ? 'Hide' : 'Add'} Custom Details
            </Button>
          </div>
          
          {showCustomReason && (
            <div>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Add specific details about this recognition..."
                value={customReason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
            </div>
          )}

          {selectedSubcategoryData && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Selected: {selectedSubcategoryData.name}
                </span>
                <Badge 
                  variant={selectedSubcategoryData.points > 0 ? "default" : "destructive"}
                >
                  {selectedSubcategoryData.points > 0 ? '+' : ''}{selectedSubcategoryData.points} {Math.abs(selectedSubcategoryData.points) === 1 ? 'point' : 'points'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {selectedSubcategoryData.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}