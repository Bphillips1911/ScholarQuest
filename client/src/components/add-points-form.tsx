import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { House, InsertPointEntry } from "@shared/schema";

export default function AddPointsForm() {
  const [selectedHouse, setSelectedHouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  const addPointsMutation = useMutation({
    mutationFn: async (data: InsertPointEntry) => {
      const response = await apiRequest("POST", "/api/points", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Points Added",
        description: "Points have been successfully added to the house.",
      });
      // Reset form
      setSelectedHouse("");
      setSelectedCategory("");
      setPoints("");
      setReason("");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/houses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add points. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHouse || !selectedCategory || !points) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const pointsNum = parseInt(points);
    if (pointsNum < 1 || pointsNum > 100) {
      toast({
        title: "Invalid Points",
        description: "Points must be between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    addPointsMutation.mutate({
      houseId: selectedHouse,
      category: selectedCategory as "academic" | "attendance" | "behavior",
      points: pointsNum,
      reason: reason || undefined,
    });
  };

  return (
    <Card className="bg-blue-50 border-blue-200" data-testid="card-add-points">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Add Points to House</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label htmlFor="house-select" className="text-sm font-medium text-gray-700 mb-2">
                Select House
              </Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse} data-testid="select-house">
                <SelectTrigger id="house-select">
                  <SelectValue placeholder="Choose a house..." />
                </SelectTrigger>
                <SelectContent>
                  {houses?.map((house) => (
                    <SelectItem key={house.id} value={house.id} data-testid={`option-house-${house.id}`}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-select" className="text-sm font-medium text-gray-700 mb-2">
                Category
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} data-testid="select-category">
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic" data-testid="option-category-academic">Academic Excellence</SelectItem>
                  <SelectItem value="attendance" data-testid="option-category-attendance">Perfect Attendance</SelectItem>
                  <SelectItem value="behavior" data-testid="option-category-behavior">Character Behavior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points-input" className="text-sm font-medium text-gray-700 mb-2">
                Points
              </Label>
              <Input
                id="points-input"
                type="number"
                placeholder="Enter points"
                min="1"
                max="100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                data-testid="input-points"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={addPointsMutation.isPending}
                data-testid="button-add-points"
              >
                {addPointsMutation.isPending ? "Adding..." : "Add Points"}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="reason-input" className="text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </Label>
            <Input
              id="reason-input"
              type="text"
              placeholder="e.g., Outstanding project presentation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="input-reason"
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
