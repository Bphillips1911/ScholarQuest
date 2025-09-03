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

// PBIS Recognition Categories - Expanded with 20+ specific recognitions and variable points (1-10)
export const pbisCategories: PBISCategory[] = [
  {
    id: "attendance",
    name: "Attendance",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-blue-500",
    subcategories: [
      { id: "perfect_week", name: "Perfect Attendance (1 Week)", points: 3, description: "No tardies or absences for one full week" },
      { id: "perfect_month", name: "Perfect Attendance (1 Month)", points: 8, description: "No tardies or absences for one full month" },
      { id: "perfect_semester", name: "Perfect Attendance (Semester)", points: 10, description: "No tardies or absences for entire semester" },
      { id: "on_time_daily", name: "On Time to Class Daily", points: 1, description: "Arrives to all classes on time for the day" },
      { id: "early_arrival", name: "Early to School", points: 2, description: "Arrives to school early and ready to learn" },
      { id: "improved_attendance", name: "Improved Attendance", points: 4, description: "Shows significant improvement in attendance patterns" },
      { id: "punctual_week", name: "Punctual All Week", points: 3, description: "No tardies for entire week" },
      { id: "prepared_daily", name: "Prepared for Class", points: 1, description: "Comes to class with all materials ready" }
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
      { id: "following_directions", name: "Following Directions First Time", points: 1, description: "Listens and follows instructions immediately" },
      { id: "positive_attitude", name: "Positive Attitude", points: 2, description: "Maintains optimistic outlook and encourages others" },
      { id: "conflict_resolution", name: "Conflict Resolution", points: 4, description: "Handles disagreements appropriately and peacefully" },
      { id: "leadership", name: "Demonstrating Leadership", points: 5, description: "Takes initiative and guides others positively" },
      { id: "peer_mentoring", name: "Peer Mentoring", points: 4, description: "Helps younger students or struggling peers" },
      { id: "school_pride", name: "Showing School Pride", points: 3, description: "Represents BHSA positively in actions and words" },
      { id: "exceptional_kindness", name: "Exceptional Kindness", points: 3, description: "Goes above and beyond to be kind to others" },
      { id: "community_service", name: "Community Service", points: 6, description: "Volunteers time to help school or community" }
    ]
  },
  {
    id: "academic",
    name: "Academic",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "bg-purple-500",
    subcategories: [
      { id: "assignment_completed", name: "Assignment Completed on Time", points: 1, description: "Submits all work by the due date" },
      { id: "quality_work", name: "Exceptional Quality Work", points: 3, description: "Shows outstanding effort and attention to detail" },
      { id: "class_participation", name: "Active Class Participation", points: 2, description: "Engages in discussions and asks thoughtful questions" },
      { id: "academic_improvement", name: "Significant Academic Improvement", points: 5, description: "Shows major progress in academic performance" },
      { id: "extra_credit", name: "Extra Credit Completed", points: 2, description: "Goes above and beyond with additional learning" },
      { id: "iready_green", name: "I-Ready Green Achievement", points: 4, description: "Achieves green level on I-Ready assessment" },
      { id: "honor_roll", name: "Honor Roll Achievement", points: 8, description: "Achieves A/B honor roll status" },
      { id: "test_mastery", name: "Test Mastery", points: 3, description: "Scores proficient or advanced on major assessment" },
      { id: "homework_streak", name: "Homework Completion Streak", points: 4, description: "Completes homework consistently for 2+ weeks" },
      { id: "project_excellence", name: "Project Excellence", points: 5, description: "Demonstrates exceptional work on major project" },
      { id: "academic_growth", name: "Academic Growth Milestone", points: 6, description: "Shows measurable growth on standardized assessments" }
    ]
  },
  {
    id: "universal_positive",
    name: "Universal Positive Characteristics",
    icon: <Star className="h-4 w-4" />,
    color: "bg-yellow-500",
    subcategories: [
      { id: "motivated", name: "Motivated - Takes Initiative", points: 3, description: "Shows self-directed learning and motivation" },
      { id: "understanding", name: "Understanding - Shows Empathy", points: 3, description: "Demonstrates compassion and understanding of others" },
      { id: "safe", name: "Safe - Promotes Safety", points: 2, description: "Follows safety rules and helps others stay safe" },
      { id: "teamwork", name: "Teamwork - Collaborates Well", points: 3, description: "Works effectively with others toward common goals" },
      { id: "accountable", name: "Accountable - Takes Responsibility", points: 4, description: "Owns actions and makes things right when needed" },
      { id: "noble", name: "Noble - Shows Integrity", points: 5, description: "Demonstrates honesty and strong moral character" },
      { id: "growth", name: "Growth - Embraces Learning", points: 4, description: "Shows willingness to learn from mistakes and improve" },
      { id: "excellence", name: "Striving for Excellence", points: 6, description: "Consistently aims for the highest standards" },
      { id: "perseverance", name: "Perseverance", points: 5, description: "Continues working hard despite challenges" },
      { id: "creativity", name: "Creativity and Innovation", points: 4, description: "Shows original thinking and creative problem-solving" },
      { id: "school_spirit", name: "Exceptional School Spirit", points: 3, description: "Shows outstanding pride in BHSA community" }
    ]
  },
  {
    id: "universal_negative",
    name: "Universal Negative Characteristics", 
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-500",
    subcategories: [
      { id: "incomplete_work", name: "Incomplete Work", points: -1, description: "Fails to complete assignments or tasks" },
      { id: "inappropriate_behavior", name: "Inappropriate Behavior", points: -2, description: "Acts in ways that violate school expectations" },
      { id: "disruptive_behavior", name: "Disruptive Behavior", points: -2, description: "Interrupts learning environment for others" },
      { id: "disrespect", name: "Disrespectful Communication", points: -2, description: "Uses inappropriate language or tone with others" },
      { id: "not_following_directions", name: "Not Following Directions", points: -1, description: "Ignores or refuses to follow instructions" },
      { id: "tardy", name: "Tardy to Class", points: -1, description: "Arrives late to class without excuse" },
      { id: "unprepared", name: "Unprepared for Class", points: -1, description: "Comes to class without necessary materials" },
      { id: "poor_choices", name: "Poor Decision Making", points: -3, description: "Makes choices that negatively impact learning or safety" }
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
              className={`cursor-pointer transition-all hover:shadow-md border-0 ${
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
                className={`cursor-pointer transition-all hover:shadow-sm border-0 ${
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