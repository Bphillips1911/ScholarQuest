import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, TrendingUp, TrendingDown, Award, Users } from "lucide-react";
import type { Scholar, PbisEntry } from "@shared/schema";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface MonthlyData {
  month: number;
  year: number;
  totalPositive: number;
  totalNegative: number;
  netPoints: number;
  entries: PbisEntry[];
}

interface StudentMonthlyReport {
  scholar: Scholar;
  monthlyData: MonthlyData[];
}

export default function MonthlyPBIS() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: scholars = [], isLoading: scholarsLoading } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
  });

  const { data: pbisEntries = [], isLoading: entriesLoading } = useQuery<PbisEntry[]>({
    queryKey: ["/api/pbis"],
  });

  // Filter scholars based on search term
  const filteredScholars = scholars.filter(scholar =>
    scholar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scholar.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get monthly data for all students
  const getMonthlyData = (scholarId: string): MonthlyData[] => {
    const scholarEntries = pbisEntries.filter(entry => entry.scholarId === scholarId);
    const monthlyMap = new Map<string, MonthlyData>();

    scholarEntries.forEach(entry => {
      const entryDate = entry.createdAt ? new Date(entry.createdAt) : new Date();
      const month = entryDate.getMonth() + 1;
      const year = entryDate.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month,
          year,
          totalPositive: 0,
          totalNegative: 0,
          netPoints: 0,
          entries: [],
        });
      }

      const monthData = monthlyMap.get(key)!;
      monthData.entries.push(entry);

      if ((entry as any).entryType === "positive" || entry.points > 0) {
        monthData.totalPositive += Math.abs(entry.points);
      } else {
        monthData.totalNegative += Math.abs(entry.points);
      }
      monthData.netPoints = monthData.totalPositive - monthData.totalNegative;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  // Get data for selected month and year
  const getSelectedMonthData = () => {
    return filteredScholars.map(scholar => {
      const entries = pbisEntries.filter(entry => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt) : new Date();
        return (
          entry.scholarId === scholar.id &&
          entryDate.getMonth() + 1 === selectedMonth &&
          entryDate.getFullYear() === selectedYear
        );
      });

      const positivePoints = entries
        .filter(entry => (entry as any).entryType === "positive" || entry.points > 0)
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);

      const negativePoints = entries
        .filter(entry => (entry as any).entryType === "negative" || entry.points < 0)
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);

      return {
        scholar,
        entries,
        positivePoints,
        negativePoints,
        netPoints: positivePoints - negativePoints,
      };
    }).filter(data => data.entries.length > 0);
  };

  // Export individual student data
  const exportStudentData = async (scholarId: string, format: "csv" | "excel") => {
    try {
      const response = await fetch(`/api/export/student/${scholarId}?format=${format}&month=${selectedMonth}&year=${selectedYear}`, {
        method: "GET",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        const scholar = scholars.find(s => s.id === scholarId);
        const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
        const filename = `${scholar?.name.replace(/\s+/g, '_')}_${monthName}_${selectedYear}_PBIS_Report.${format === "csv" ? "csv" : "xlsx"}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const selectedMonthData = getSelectedMonthData();
  const selectedMonthName = MONTHS.find(m => m.value === selectedMonth)?.label;

  if (scholarsLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monthly PBIS data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly PBIS Tracking</h1>
          <p className="text-gray-600 mt-2">Track individual student PBIS points by month with detailed reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <Badge variant="outline" className="text-lg px-3 py-1">
            {selectedMonthName} {selectedYear}
          </Badge>
        </div>
      </div>

      {/* Month and Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Month & Year
          </CardTitle>
          <CardDescription>Choose the time period to view PBIS data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-32">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium mb-2 block">Search Students</label>
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview - {selectedMonthName} {selectedYear}</CardTitle>
          <CardDescription>Summary of PBIS activity for the selected month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total Positive</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {selectedMonthData.reduce((sum, data) => sum + data.positivePoints, 0)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Total Negative</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {selectedMonthData.reduce((sum, data) => sum + data.negativePoints, 0)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Net Points</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {selectedMonthData.reduce((sum, data) => sum + data.netPoints, 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Active Students</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {selectedMonthData.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Student Data */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Student Reports</CardTitle>
          <CardDescription>Detailed PBIS data for each student with export options</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedMonthData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No PBIS data found for {selectedMonthName} {selectedYear}</p>
              <p className="text-sm text-gray-400">Try selecting a different month or year</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMonthData.map((studentData) => (
                <div key={studentData.scholar.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{studentData.scholar.name}</h3>
                      <p className="text-sm text-gray-600">
                        ID: {studentData.scholar.studentId} • Grade: {studentData.scholar.grade} • 
                        House: {studentData.scholar.houseId ? 
                          studentData.scholar.houseId.charAt(0).toUpperCase() + studentData.scholar.houseId.slice(1) 
                          : "Unassigned"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportStudentData(studentData.scholar.id, "csv")}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportStudentData(studentData.scholar.id, "excel")}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Excel
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-800 font-medium">Positive Points</p>
                      <p className="text-xl font-bold text-green-600">+{studentData.positivePoints}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm text-red-800 font-medium">Negative Points</p>
                      <p className="text-xl font-bold text-red-600">-{studentData.negativePoints}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm text-blue-800 font-medium">Net Points</p>
                      <p className={`text-xl font-bold ${studentData.netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {studentData.netPoints >= 0 ? '+' : ''}{studentData.netPoints}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Recent Entries ({studentData.entries.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {studentData.entries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                          <div>
                            <span className={`font-medium ${entry.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.points >= 0 ? '+' : ''}{entry.points}
                            </span>
                            <span className="ml-2">{entry.category} - {entry.subcategory}</span>
                            <span className="ml-2 text-gray-500">by {entry.teacherName}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {entry.mustangTrait}
                          </Badge>
                        </div>
                      ))}
                      {studentData.entries.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          And {studentData.entries.length - 5} more entries...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}