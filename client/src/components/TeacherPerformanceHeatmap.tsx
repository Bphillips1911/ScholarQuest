import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Award, 
  Activity,
  RefreshCw,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';

interface TeacherPerformanceHeatmapProps {
  className?: string;
}

interface TeacherPerformanceData {
  teacherId: string;
  teacherName: string;
  grade: string;
  effectivenessRating: number;
  studentEngagementScore: number;
  pbisPointsAwarded: number;
  parentCommunications: number;
  avgResponseTime: number;
  totalStudentsManaged: number;
  trend: number;
}

interface HeatmapData {
  teachers: TeacherPerformanceData[];
  summary: {
    averageEffectiveness: number;
    totalPBISPoints: number;
    totalCommunications: number;
    averageResponseTime: number;
  };
}

export function TeacherPerformanceHeatmap({ className }: TeacherPerformanceHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('effectivenessRating');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedDateRange));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Get performance heatmap data
  const { data: rawHeatmapData, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/admin/performance-heatmap', selectedDateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/performance-heatmap?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }
      
      return response.json();
    },
    enabled: true
  });

  // Transform backend data to frontend format
  const heatmapData: HeatmapData | undefined = rawHeatmapData ? {
    teachers: rawHeatmapData.teachers
      ?.filter((teacher: any) => {
        // Apply grade filter
        if (selectedGrade !== 'all' && teacher.gradeRole !== selectedGrade) {
          return false;
        }
        return true;
      })
      .map((teacher: any) => ({
        teacherId: teacher.id,
        teacherName: teacher.name,
        grade: teacher.gradeRole,
        effectivenessRating: teacher.avgEffectivenessRating || 0,
        studentEngagementScore: teacher.avgStudentEngagementScore || 0,
        pbisPointsAwarded: teacher.totalPositiveInteractions || 0,
        parentCommunications: teacher.totalParentCommunications || 0,
        avgResponseTime: teacher.avgResponseTime || 0,
        totalStudentsManaged: teacher.totalStudentsManaged || 0,
        trend: 0 // Calculate trend if needed
      })) || [],
    summary: rawHeatmapData.summary || {
      averageEffectiveness: 0,
      totalPBISPoints: 0,
      totalCommunications: 0,
      averageResponseTime: 0
    }
  } : undefined;

  // Calculate teacher metrics
  const calculateMetricsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch('/api/admin/calculate-teacher-metrics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate metrics');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Metrics Updated",
        description: "Teacher performance metrics have been recalculated",
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate teacher metrics",
        variant: "destructive",
      });
    }
  });

  // Calculate top performers from current data
  const topPerformers = useMemo(() => {
    if (!heatmapData?.teachers) return [];
    
    return [...heatmapData.teachers]
      .sort((a, b) => {
        const aValue = a[selectedMetric as keyof TeacherPerformanceData] as number || 0;
        const bValue = b[selectedMetric as keyof TeacherPerformanceData] as number || 0;
        
        // For response time, lower is better
        if (selectedMetric === 'avgResponseTime') {
          return aValue - bValue;
        }
        // For other metrics, higher is better
        return bValue - aValue;
      })
      .slice(0, 10); // Top 10 performers
  }, [heatmapData?.teachers, selectedMetric]);

  // Performance metrics configuration
  const performanceMetrics = [
    { 
      id: 'effectivenessRating', 
      label: 'Overall Effectiveness', 
      description: 'Comprehensive performance score',
      icon: Award,
      color: 'from-purple-500 to-purple-700'
    },
    { 
      id: 'studentEngagementScore', 
      label: 'Student Engagement', 
      description: 'How well teachers engage students',
      icon: Users,
      color: 'from-blue-500 to-blue-700'
    },
    { 
      id: 'pbisPointsAwarded', 
      label: 'PBIS Points Awarded', 
      description: 'Positive behavior recognition',
      icon: Award,
      color: 'from-green-500 to-green-700'
    },
    { 
      id: 'parentCommunications', 
      label: 'Parent Communications', 
      description: 'Frequency of parent interactions',
      icon: MessageSquare,
      color: 'from-orange-500 to-orange-700'
    },
    { 
      id: 'avgResponseTime', 
      label: 'Response Time (Hours)', 
      description: 'Average response time to issues',
      icon: Activity,
      color: 'from-red-500 to-red-700'
    }
  ];

  const currentMetric = performanceMetrics.find(m => m.id === selectedMetric);

  // Color intensity based on performance value
  const getPerformanceColor = (value: number, metric: string) => {
    const intensity = Math.min(value / 100, 1); // Normalize to 0-1
    
    if (metric === 'avgResponseTime') {
      // Lower is better for response time
      const reversedIntensity = 1 - Math.min(value / 24, 1); // 24 hours max
      return `rgba(239, 68, 68, ${reversedIntensity * 0.8 + 0.1})`;
    } else {
      // Higher is better for other metrics
      return `rgba(34, 197, 94, ${intensity * 0.8 + 0.1})`;
    }
  };

  const getPerformanceRating = (value: number, metric: string) => {
    if (metric === 'avgResponseTime') {
      if (value <= 2) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
      if (value <= 8) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
      if (value <= 24) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
      return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    } else {
      if (value >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
      if (value >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
      if (value >= 50) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
      return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
    }
  };

  // Export performance data
  const exportPerformanceData = () => {
    try {
      if (!heatmapData || !heatmapData.teachers || heatmapData.teachers.length === 0) {
        alert('No performance data available to export.');
        return;
      }
      
      console.log('Exporting performance data:', heatmapData.teachers.length, 'teachers');
      
      const csvData = heatmapData.teachers.map((teacher: TeacherPerformanceData) => ({
        Teacher: teacher.teacherName || 'Unknown',
        Grade: teacher.grade || 'N/A',
        'Effectiveness Rating': teacher.effectivenessRating || 0,
        'Student Engagement': teacher.studentEngagementScore || 0,
        'PBIS Points': teacher.pbisPointsAwarded || 0,
        'Parent Communications': teacher.parentCommunications || 0,
        'Response Time (Hours)': teacher.avgResponseTime || 0,
        'Students Managed': teacher.totalStudentsManaged || 0,
        'Date Range': `${selectedDateRange} days`
      }));

      const csvString = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Export completed successfully');
      alert(`Performance data exported successfully! File: teacher-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export performance data. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Interactive Teacher Performance Heatmap
            <Badge variant="outline" className="ml-auto">Admin Only</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive analytics and performance insights for all teachers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Performance Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger data-testid="select-metric">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {performanceMetrics.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grade Filter</label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger data-testid="select-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="6th Grade">6th Grade</SelectItem>
                  <SelectItem value="7th Grade">7th Grade</SelectItem>
                  <SelectItem value="8th Grade">8th Grade</SelectItem>
                  <SelectItem value="Unified Arts">Unified Arts</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => calculateMetricsMutation.mutate()}
                  disabled={calculateMetricsMutation.isPending}
                  data-testid="button-refresh-metrics"
                >
                  <RefreshCw className={cn("h-4 w-4", calculateMetricsMutation.isPending && "animate-spin")} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportPerformanceData}
                  data-testid="button-export-data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Metric Info */}
          {currentMetric && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={cn(
                "p-2 rounded-full text-white bg-gradient-to-r",
                currentMetric.color
              )}>
                <currentMetric.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium">{currentMetric.label}</div>
                <div className="text-sm text-muted-foreground">{currentMetric.description}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Heatmap Grid */}
      {heatmapData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance Heatmap</span>
              <Badge variant="outline">
                {heatmapData.teachers?.length || 0} Teachers
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {heatmapData.teachers?.map((teacher: TeacherPerformanceData) => {
                const metricValue = teacher[selectedMetric as keyof TeacherPerformanceData] as number || 0;
                const performance = getPerformanceRating(metricValue, selectedMetric);
                
                return (
                  <Card 
                    key={teacher.teacherId}
                    className="relative overflow-hidden hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: getPerformanceColor(metricValue, selectedMetric)
                    }}
                    data-testid={`teacher-card-${teacher.teacherId}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Teacher Info */}
                        <div>
                          <div className="font-semibold text-lg">{teacher.teacherName}</div>
                          <div className="text-sm text-muted-foreground">{teacher.grade}</div>
                        </div>

                        {/* Current Metric Display */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Current Metric</span>
                            <Badge className={performance.color}>
                              {performance.label}
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedMetric === 'avgResponseTime' 
                              ? `${metricValue}h` 
                              : typeof metricValue === 'number' 
                                ? metricValue.toLocaleString()
                                : metricValue
                            }
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Students</div>
                            <div className="font-semibold">{teacher.totalStudentsManaged}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">PBIS Points</div>
                            <div className="font-semibold">{teacher.pbisPointsAwarded}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Messages</div>
                            <div className="font-semibold">{teacher.parentCommunications}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Engagement</div>
                            <div className="font-semibold">{teacher.studentEngagementScore}%</div>
                          </div>
                        </div>

                        {/* Trend Indicator */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            vs Previous Period
                          </span>
                          <div className="flex items-center gap-1">
                            {teacher.trend > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : teacher.trend < 0 ? (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            ) : null}
                            <span className={cn(
                              "text-xs font-medium",
                              teacher.trend > 0 ? "text-green-600" : 
                              teacher.trend < 0 ? "text-red-600" : "text-muted-foreground"
                            )}>
                              {teacher.trend > 0 ? '+' : ''}{teacher.trend || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {topPerformers && topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performers - {currentMetric?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.slice(0, 3).map((teacher: TeacherPerformanceData, index: number) => (
                <Card key={teacher.teacherId} className="text-center">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <Badge 
                          variant={index === 0 ? "default" : "secondary"}
                          className={cn(
                            "text-lg px-4 py-2",
                            index === 0 && "bg-yellow-500 text-white",
                            index === 1 && "bg-gray-400 text-white",
                            index === 2 && "bg-orange-600 text-white"
                          )}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="font-semibold text-lg">{teacher.teacherName}</div>
                      <div className="text-sm text-muted-foreground">{teacher.grade}</div>
                      <div className="text-2xl font-bold text-primary">
                        {selectedMetric === 'avgResponseTime' 
                          ? `${teacher[selectedMetric as keyof TeacherPerformanceData]}h` 
                          : teacher[selectedMetric as keyof TeacherPerformanceData]
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {heatmapData?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {heatmapData.summary.averageEffectiveness}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Effectiveness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {heatmapData.summary.totalPBISPoints.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total PBIS Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {heatmapData.summary.totalCommunications.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Communications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {heatmapData.summary.averageResponseTime}h
                </div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}