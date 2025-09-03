import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, FileText, Download, BarChart3, TrendingUp, Users } from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface Student {
  id: string;
  name: string;
  grade: number;
  username: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  houseId: string;
  createdBy?: string;
  gradeLevel?: number;
}

interface ProgressReportGeneratorProps {
  studentId?: string;
  studentName?: string;
  onReportGenerated?: () => void;
  isAdminView?: boolean;
}

export function ProgressReportGenerator({ studentId, studentName, onReportGenerated, isAdminView = false }: ProgressReportGeneratorProps) {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'semester' | 'custom'>('weekly');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined
  });
  const [showCustomDates, setShowCustomDates] = useState(false);
  const { toast } = useToast();

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const student = Array.isArray(studentsData) ? studentsData.find((s: Student) => s.id === studentId) : null;
    setSelectedStudent(student || null);
  };

  // Get all students for admin view
  const { data: studentsData } = useQuery({
    queryKey: ['/api/scholars'],
    enabled: isAdminView,
  });

  // Get existing reports for selected student
  const { data: existingReports, refetch: refetchReports } = useQuery({
    queryKey: ['/api/teacher/progress-reports', selectedStudentId],
    enabled: !!selectedStudentId
  });

  // Get teacher information for the selected student
  const { data: teacherData } = useQuery({
    queryKey: ['/api/teacher/by-student', selectedStudentId],
    enabled: !!selectedStudentId && isAdminView,
  });

  // Generate new report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (data: { reportType: string; customDateRange?: any }) => {
      const targetStudentId = selectedStudentId || studentId;
      if (!targetStudentId) {
        throw new Error('No student selected');
      }
      return await apiRequest(`/api/teacher/progress-report/${targetStudentId}`, 'POST', data);
    },
    onSuccess: (report) => {
      const targetStudentName = selectedStudent?.name || studentName || 'Selected Student';
      toast({
        title: "Report Generated Successfully",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report created for ${targetStudentName}`,
      });
      refetchReports();
      onReportGenerated?.();
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: error.message || "Failed to generate progress report",
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    const targetStudentId = selectedStudentId || studentId;
    if (!targetStudentId) {
      toast({
        title: "No Student Selected",
        description: "Please select a student to generate a report for",
        variant: "destructive",
      });
      return;
    }

    if (reportType === 'custom') {
      if (!customDateRange.start || !customDateRange.end) {
        toast({
          title: "Invalid Date Range",
          description: "Please select both start and end dates for custom report",
          variant: "destructive",
        });
        return;
      }
      
      generateReportMutation.mutate({
        reportType: 'custom',
        customDateRange: {
          start: customDateRange.start,
          end: customDateRange.end
        }
      });
    } else {
      generateReportMutation.mutate({ reportType });
    }
  };

  const getDateRangeText = (type: string) => {
    const now = new Date();
    switch (type) {
      case 'weekly':
        return `${format(subWeeks(now, 1), 'MMM dd')} - ${format(now, 'MMM dd, yyyy')}`;
      case 'monthly':
        return `${format(subMonths(now, 1), 'MMM dd')} - ${format(now, 'MMM dd, yyyy')}`;
      case 'semester':
        return `${format(subMonths(now, 4), 'MMM dd')} - ${format(now, 'MMM dd, yyyy')}`;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return `${format(customDateRange.start, 'MMM dd')} - ${format(customDateRange.end, 'MMM dd, yyyy')}`;
        }
        return 'Select date range';
      default:
        return '';
    }
  };

  const downloadReportAsPDF = (report: any) => {
    const currentStudent = selectedStudent || { name: studentName, grade: 'N/A', username: 'N/A' };
    const studentDisplayName = currentStudent?.name || studentName || 'Student';
    const studentGrade = currentStudent?.grade || currentStudent?.gradeLevel || 'N/A';
    const teacherInfo = teacherData?.name || 'N/A';
    
    // Create a comprehensive HTML report that can be printed/saved as PDF
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Progress Report - ${studentDisplayName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin: 20px 0; }
          .grade-badge { display: inline-block; padding: 5px 10px; background: #4CAF50; color: white; border-radius: 5px; margin: 5px; }
          .achievement { background: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; margin: 10px 0; }
          .chart-placeholder { width: 100%; height: 200px; background: #f5f5f5; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .positive { color: #059669; }
          .negative { color: #dc2626; }
          .print-only { display: none; }
          @media print { .no-print { display: none; } .print-only { display: block; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bush Hills STEAM Academy</h1>
          <h2>Student Progress Report</h2>
          <h3>${studentDisplayName} - Grade ${studentGrade}</h3>
          <p><strong>Student ID:</strong> ${currentStudent?.username || 'N/A'}</p>
          <p><strong>House:</strong> ${report.reportData?.student?.house || 'N/A'} House</p>
          <p><strong>Teacher/Class:</strong> ${teacherInfo}</p>
          <p><strong>Report Period:</strong> ${report.reportData?.period?.start || format(subWeeks(new Date(), 1), 'MMM dd, yyyy')} to ${report.reportData?.period?.end || format(new Date(), 'MMM dd, yyyy')}</p>
          <p><strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>

        <div class="section">
          <h3>Executive Summary</h3>
          <div class="grade-badge">Academic Points: ${currentStudent?.academicPoints || 0}</div>
          <div class="grade-badge">Behavior Points: ${currentStudent?.behaviorPoints || 0}</div>
          <div class="grade-badge">Attendance Points: ${currentStudent?.attendancePoints || 0}</div>
          <p><strong>Total PBIS Points:</strong> ${(currentStudent?.academicPoints || 0) + (currentStudent?.behaviorPoints || 0) + (currentStudent?.attendancePoints || 0)}</p>
          <p><strong>Academic Grade:</strong> ${report.academicGrade || 'A'}</p>
          <p><strong>Behavior Grade:</strong> ${report.behaviorGrade || 'A'}</p>
          <p><strong>Attendance Rate:</strong> ${report.attendanceRate || '95'}%</p>
          <p><strong>Progress Trend:</strong> ${report.reportData?.summary?.improvementTrend || 'Steady Progress'}</p>
        </div>

        <div class="section">
          <h3>MUSTANG Traits Performance</h3>
          <table>
            <thead>
              <tr><th>Trait</th><th>Positive</th><th>Negative</th><th>Total Points</th></tr>
            </thead>
            <tbody>
              ${Object.entries(report.reportData.mustangTraits || {}).map(([trait, data]: [string, any]) => `
                <tr>
                  <td>${trait}</td>
                  <td class="positive">${data.positive || 0}</td>
                  <td class="negative">${data.negative || 0}</td>
                  <td>${data.total || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Achievements & Strengths</h3>
          ${report.reportData.achievements?.map((achievement: string) => 
            `<div class="achievement">✅ ${achievement}</div>`
          ).join('') || '<p>Working on building achievements...</p>'}
        </div>

        <div class="section">
          <h3>Areas for Growth</h3>
          ${report.reportData.areasForGrowth?.map((area: string) => 
            `<div>🎯 ${area}</div>`
          ).join('') || '<p>Continuing excellent progress...</p>'}
        </div>

        <div class="section">
          <h3>Recommended Actions</h3>
          <ul>
            ${report.recommendedActions?.map((action: string) => `<li>${action}</li>`).join('') || '<li>Continue current positive behaviors</li>'}
          </ul>
        </div>

        <div class="section">
          <h3>Parent Summary</h3>
          <p>${report.reportData.parentSummary}</p>
        </div>

        <div class="section">
          <h3>Weekly Trends</h3>
          <table>
            <thead>
              <tr><th>Week</th><th>Points</th><th>Positive</th><th>Negative</th></tr>
            </thead>
            <tbody>
              ${report.reportData.weeklyTrends?.map((week: any) => `
                <tr>
                  <td>${week.week}</td>
                  <td>${week.points}</td>
                  <td class="positive">${week.positive}</td>
                  <td class="negative">${week.negative}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>

        <div class="print-only">
          <p style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
            Generated by PBIS House Champions System - ${format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          One-Click Progress Report Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdminView 
            ? "Generate comprehensive progress reports for any student with detailed analytics and insights"
            : `Generate comprehensive progress reports for ${studentName || 'student'} with detailed analytics and insights`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Selection for Admin View */}
        {isAdminView && (
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Student
            </Label>
            <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
              <SelectTrigger data-testid="select-student-progress">
                <SelectValue placeholder="Choose a student to generate report for" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(studentsData) && studentsData.map((student: Student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - Grade {student.grade || student.gradeLevel} ({student.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudent && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Selected Student:</p>
                <p className="text-sm text-blue-700">
                  {selectedStudent.name} • Grade {selectedStudent.grade || selectedStudent.gradeLevel} • 
                  Academic: {selectedStudent.academicPoints} • Behavior: {selectedStudent.behaviorPoints} • 
                  Attendance: {selectedStudent.attendancePoints}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Report Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Report Type</Label>
          <Select 
            value={reportType} 
            onValueChange={(value: any) => {
              setReportType(value);
              setShowCustomDates(value === 'custom');
            }}
          >
            <SelectTrigger data-testid="select-report-type">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly Report (Last 7 days)</SelectItem>
              <SelectItem value="monthly">Monthly Report (Last 30 days)</SelectItem>
              <SelectItem value="semester">Semester Report (Last 4 months)</SelectItem>
              <SelectItem value="custom">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground">
            <strong>Date Range:</strong> {getDateRangeText(reportType)}
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustomDates && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <Label className="text-base font-medium">Custom Date Range</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.start ? format(customDateRange.start, 'PPP') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.start}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.end ? format(customDateRange.end, 'PPP') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.end}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={generateReportMutation.isPending}
          className="w-full md:w-auto"
          data-testid="button-generate-report"
        >
          {generateReportMutation.isPending ? (
            <>
              <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
            </>
          )}
        </Button>

        {/* Recent Reports */}
        {existingReports && existingReports.length > 0 && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Recent Reports</Label>
            <div className="grid gap-3">
              {existingReports.slice(0, 5).map((report: any) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Academic: {report.academicGrade}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          Behavior: {report.behaviorGrade}
                        </span>
                        <span className="text-muted-foreground">
                          {report.totalPBISPoints} PBIS Points
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReportAsPDF(report)}
                      data-testid={`button-download-${report.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View/Print
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}