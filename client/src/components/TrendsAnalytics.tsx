import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users,
  FileText,
  FileSpreadsheet,
  Camera
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import html2canvas from 'html2canvas';

// Types for trend data
interface StudentTrendData {
  period: string;
  start: Date;
  end: Date;
  studentId: string;
  studentName: string;
  grade: number;
  houseId: string;
  positive: number;
  negative: number;
  net: number;
}

interface ClassroomTrendData {
  period: string;
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: string;
  positive: number;
  negative: number;
  net: number;
}

// Student Trends Component
export function StudentTrendsComponent() {
  const [interval, setInterval] = useState<'week' | 'month'>('week');
  const [fromDate, setFromDate] = useState(format(subWeeks(new Date(), 4), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const { data: trendData, isLoading, error } = useQuery({
    queryKey: ['/api/trends/student', interval, fromDate, toDate, selectedStudent],
    queryFn: async () => {
      const params = new URLSearchParams({
        interval,
        from: fromDate,
        to: toDate,
        ...(selectedStudent && { studentId: selectedStudent })
      });

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/trends/student?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student trends');
      }

      const data = await response.json();
      return data as StudentTrendData[];
    }
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'png') => {
    if (format === 'png') {
      const chartElement = document.getElementById('student-trends-chart');
      if (chartElement) {
        const canvas = await html2canvas(chartElement);
        const link = document.createElement('a');
        link.download = `student-trends-${interval}-${fromDate}-${toDate}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      return;
    }

    const params = new URLSearchParams({
      interval,
      from: fromDate,
      to: toDate,
      format,
      ...(selectedStudent && { studentId: selectedStudent })
    });

    const token = localStorage.getItem("adminToken");
    const response = await fetch(`/api/trends/student?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `student-trends.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Process data for chart display
  const chartData = trendData?.map(item => ({
    period: format(new Date(item.period), interval === 'week' ? 'MMM dd' : 'MMM yyyy'),
    positive: item.positive,
    negative: item.negative,
    net: item.net,
    studentName: item.studentName
  })) || [];

  // Calculate summary statistics
  const totalPositive = trendData?.reduce((sum, item) => sum + item.positive, 0) || 0;
  const totalNegative = trendData?.reduce((sum, item) => sum + item.negative, 0) || 0;
  const netTotal = totalPositive - totalNegative;
  const uniqueStudents = new Set(trendData?.map(item => item.studentId)).size || 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="interval">Time Interval</Label>
          <Select value={interval} onValueChange={(value: 'week' | 'month') => setInterval(value)}>
            <SelectTrigger data-testid="select-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            data-testid="input-from-date"
          />
        </div>

        <div>
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            data-testid="input-to-date"
          />
        </div>

        <div>
          <Label htmlFor="student">Filter by Student</Label>
          <Input
            id="student"
            placeholder="Student ID (optional)"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            data-testid="input-student-filter"
          />
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={() => handleExport('csv')} 
          variant="outline" 
          size="sm"
          data-testid="button-export-csv"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button 
          onClick={() => handleExport('xlsx')} 
          variant="outline" 
          size="sm"
          data-testid="button-export-xlsx"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        <Button 
          onClick={() => handleExport('png')} 
          variant="outline" 
          size="sm"
          data-testid="button-export-png"
        >
          <Camera className="w-4 h-4 mr-2" />
          Export Chart
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Positive</p>
                <p className="text-2xl font-bold text-green-600">{totalPositive}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Negative</p>
                <p className="text-2xl font-bold text-red-600">{totalNegative}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Total</p>
                <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netTotal >= 0 ? '+' : ''}{netTotal}
                </p>
              </div>
              <BarChart3 className={`w-8 h-8 ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-blue-600">{uniqueStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Student Behavior Trends</CardTitle>
          <CardDescription>
            {selectedStudent ? `Trends for student ID: ${selectedStudent}` : 'Trends for all students'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-gray-500">Loading trend data...</div>
            </div>
          )}

          {error && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-red-500">Error loading trend data: {error.message}</div>
            </div>
          )}

          {chartData.length > 0 && (
            <div id="student-trends-chart" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="positive" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Positive Points"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="negative" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Negative Points"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Net Points"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length === 0 && !isLoading && !error && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-gray-500">No trend data available for the selected period</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Classroom Trends Component
export function ClassroomTrendsComponent() {
  const [interval, setInterval] = useState<'week' | 'month'>('week');
  const [fromDate, setFromDate] = useState(format(subWeeks(new Date(), 4), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: trendData, isLoading, error } = useQuery({
    queryKey: ['/api/trends/classroom', interval, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        interval,
        from: fromDate,
        to: toDate
      });

      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/trends/classroom?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classroom trends');
      }

      const data = await response.json();
      return data as ClassroomTrendData[];
    }
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'png') => {
    if (format === 'png') {
      const chartElement = document.getElementById('classroom-trends-chart');
      if (chartElement) {
        const canvas = await html2canvas(chartElement);
        const link = document.createElement('a');
        link.download = `classroom-trends-${interval}-${fromDate}-${toDate}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      return;
    }

    const params = new URLSearchParams({
      interval,
      from: fromDate,
      to: toDate,
      format
    });

    const token = localStorage.getItem("adminToken");
    const response = await fetch(`/api/trends/classroom?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `classroom-trends.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Process data for chart display
  const chartData = trendData?.map(item => ({
    period: format(new Date(item.period), interval === 'week' ? 'MMM dd' : 'MMM yyyy'),
    positive: item.positive,
    negative: item.negative,
    net: item.net,
    teacherName: item.teacherName
  })) || [];

  // Calculate summary statistics
  const totalPositive = trendData?.reduce((sum, item) => sum + item.positive, 0) || 0;
  const totalNegative = trendData?.reduce((sum, item) => sum + item.negative, 0) || 0;
  const netTotal = totalPositive - totalNegative;
  const uniqueTeachers = new Set(trendData?.map(item => item.teacherId)).size || 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="interval">Time Interval</Label>
          <Select value={interval} onValueChange={(value: 'week' | 'month') => setInterval(value)}>
            <SelectTrigger data-testid="select-classroom-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            data-testid="input-classroom-from-date"
          />
        </div>

        <div>
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            data-testid="input-classroom-to-date"
          />
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={() => handleExport('csv')} 
          variant="outline" 
          size="sm"
          data-testid="button-classroom-export-csv"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button 
          onClick={() => handleExport('xlsx')} 
          variant="outline" 
          size="sm"
          data-testid="button-classroom-export-xlsx"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        <Button 
          onClick={() => handleExport('png')} 
          variant="outline" 
          size="sm"
          data-testid="button-classroom-export-png"
        >
          <Camera className="w-4 h-4 mr-2" />
          Export Chart
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Positive</p>
                <p className="text-2xl font-bold text-green-600">{totalPositive}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Negative</p>
                <p className="text-2xl font-bold text-red-600">{totalNegative}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Total</p>
                <p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netTotal >= 0 ? '+' : ''}{netTotal}
                </p>
              </div>
              <BarChart3 className={`w-8 h-8 ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-bold text-blue-600">{uniqueTeachers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Classroom Behavior Trends</CardTitle>
          <CardDescription>Performance trends across all teachers and classrooms</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-gray-500">Loading classroom trend data...</div>
            </div>
          )}

          {error && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-red-500">Error loading classroom trend data: {error.message}</div>
            </div>
          )}

          {chartData.length > 0 && (
            <div id="classroom-trends-chart" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" fill="#10b981" name="Positive Points" />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative Points" />
                  <Bar dataKey="net" fill="#3b82f6" name="Net Points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length === 0 && !isLoading && !error && (
            <div className="h-80 flex items-center justify-center">
              <div className="text-gray-500">No classroom trend data available for the selected period</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}