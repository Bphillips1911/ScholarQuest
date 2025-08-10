import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar, Download, TrendingUp, TrendingDown, Award, Users, FileText, Printer, FileSpreadsheet, File } from "lucide-react";
import { useReactToPrint } from "react-to-print";
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
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  
  const printComponentRef = useRef<HTMLDivElement>(null);
  const classPrintRef = useRef<HTMLDivElement>(null);

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

  // Get class data for selected teacher/grade
  const getClassData = () => {
    let classStudents = filteredScholars;
    
    if (selectedGrade) {
      classStudents = classStudents.filter(scholar => scholar.grade.toString() === selectedGrade);
    }
    
    return classStudents.map(scholar => {
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
    });
  };

  // Export functions for different formats
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

  const exportToPDF = async (studentData: any, isClassReport = false) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
    
    if (isClassReport) {
      doc.setFontSize(16);
      doc.text(`Class PBIS Report - ${monthName} ${selectedYear}`, 14, 22);
      doc.setFontSize(10);
      doc.text(`Grade: ${selectedGrade || "All Grades"}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
      
      const tableData = studentData.map((student: any) => [
        student.scholar.name,
        student.scholar.studentId,
        student.scholar.grade,
        student.positivePoints,
        student.negativePoints,
        student.netPoints,
        student.entries.length
      ]);
      
      (doc as any).autoTable({
        head: [['Name', 'Student ID', 'Grade', 'Positive', 'Negative', 'Net', 'Entries']],
        body: tableData,
        startY: 42,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    } else {
      const student = studentData;
      doc.setFontSize(16);
      doc.text(`Individual PBIS Report - ${student.scholar.name}`, 14, 22);
      doc.setFontSize(10);
      doc.text(`Student ID: ${student.scholar.studentId} | Grade: ${student.scholar.grade}`, 14, 30);
      doc.text(`Report Period: ${monthName} ${selectedYear}`, 14, 36);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
      
      // Summary section
      doc.setFontSize(12);
      doc.text('Summary:', 14, 54);
      doc.setFontSize(10);
      doc.text(`Positive Points: ${student.positivePoints}`, 14, 62);
      doc.text(`Negative Points: ${student.negativePoints}`, 14, 68);
      doc.text(`Net Points: ${student.netPoints}`, 14, 74);
      doc.text(`Total Entries: ${student.entries.length}`, 14, 80);
      
      // Entries table
      if (student.entries.length > 0) {
        const tableData = student.entries.map((entry: any) => [
          new Date(entry.createdAt).toLocaleDateString(),
          entry.points >= 0 ? 'Positive' : 'Negative',
          entry.points,
          entry.category,
          entry.subcategory,
          entry.mustangTrait,
          entry.teacherName
        ]);
        
        (doc as any).autoTable({
          head: [['Date', 'Type', 'Points', 'Category', 'Subcategory', 'MUSTANG Trait', 'Teacher']],
          body: tableData,
          startY: 86,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      }
    }
    
    const filename = isClassReport 
      ? `Class_PBIS_Report_${monthName}_${selectedYear}.pdf`
      : `${studentData.scholar.name.replace(/\s+/g, '_')}_PBIS_Report_${monthName}_${selectedYear}.pdf`;
    
    doc.save(filename);
  };

  const exportToWord = async (studentData: any, isClassReport = false) => {
    const docx = await import('docx');
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
    
    let docContent;
    
    if (isClassReport) {
      const tableRows = studentData.map((student: any) => 
        new docx.TableRow({
          children: [
            new docx.TableCell({ children: [new docx.Paragraph(student.scholar.name)] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.scholar.studentId)] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.scholar.grade.toString())] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.positivePoints.toString())] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.negativePoints.toString())] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.netPoints.toString())] }),
            new docx.TableCell({ children: [new docx.Paragraph(student.entries.length.toString())] })
          ]
        })
      );
      
      docContent = [
        new docx.Paragraph({
          text: `Class PBIS Report - ${monthName} ${selectedYear}`,
          heading: docx.HeadingLevel.HEADING_1
        }),
        new docx.Paragraph(`Grade: ${selectedGrade || "All Grades"}`),
        new docx.Paragraph(`Generated: ${new Date().toLocaleDateString()}`),
        new docx.Paragraph(""),
        new docx.Table({
          rows: [
            new docx.TableRow({
              children: [
                new docx.TableCell({ children: [new docx.Paragraph("Name")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Student ID")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Grade")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Positive")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Negative")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Net")] }),
                new docx.TableCell({ children: [new docx.Paragraph("Entries")] })
              ]
            }),
            ...tableRows
          ]
        })
      ];
    } else {
      const student = studentData;
      docContent = [
        new docx.Paragraph({
          text: `Individual PBIS Report - ${student.scholar.name}`,
          heading: docx.HeadingLevel.HEADING_1
        }),
        new docx.Paragraph(`Student ID: ${student.scholar.studentId} | Grade: ${student.scholar.grade}`),
        new docx.Paragraph(`Report Period: ${monthName} ${selectedYear}`),
        new docx.Paragraph(`Generated: ${new Date().toLocaleDateString()}`),
        new docx.Paragraph(""),
        new docx.Paragraph({
          text: "Summary:",
          heading: docx.HeadingLevel.HEADING_2
        }),
        new docx.Paragraph(`Positive Points: ${student.positivePoints}`),
        new docx.Paragraph(`Negative Points: ${student.negativePoints}`),
        new docx.Paragraph(`Net Points: ${student.netPoints}`),
        new docx.Paragraph(`Total Entries: ${student.entries.length}`),
        new docx.Paragraph("")
      ];
      
      if (student.entries.length > 0) {
        const entryRows = student.entries.map((entry: any) =>
          new docx.TableRow({
            children: [
              new docx.TableCell({ children: [new docx.Paragraph(new Date(entry.createdAt).toLocaleDateString())] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.points >= 0 ? 'Positive' : 'Negative')] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.points.toString())] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.category)] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.subcategory)] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.mustangTrait)] }),
              new docx.TableCell({ children: [new docx.Paragraph(entry.teacherName)] })
            ]
          })
        );
        
        docContent.push(
          new docx.Paragraph({
            text: "PBIS Entries:",
            heading: docx.HeadingLevel.HEADING_2
          }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph("Date")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Type")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Points")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Category")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Subcategory")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("MUSTANG Trait")] }),
                  new docx.TableCell({ children: [new docx.Paragraph("Teacher")] })
                ]
              }),
              ...entryRows
            ]
          })
        );
      }
    }
    
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: docContent
      }]
    });
    
    const buffer = await docx.Packer.toBlob(doc);
    const url = window.URL.createObjectURL(buffer);
    const a = document.createElement("a");
    a.href = url;
    
    const filename = isClassReport 
      ? `Class_PBIS_Report_${monthName}_${selectedYear}.docx`
      : `${studentData.scholar.name.replace(/\s+/g, '_')}_PBIS_Report_${monthName}_${selectedYear}.docx`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Print functions
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `Individual_PBIS_Report_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}`,
  });

  const handleClassPrint = useReactToPrint({
    content: () => classPrintRef.current,
    documentTitle: `Class_PBIS_Report_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}`,
  });

  const selectedMonthData = getSelectedMonthData();
  const classData = getClassData();
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

      {/* Enhanced Reporting Interface with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>PBIS Reports & Export Center</CardTitle>
          <CardDescription>Comprehensive reporting with multiple export formats and printing capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="individual">Individual Students</TabsTrigger>
              <TabsTrigger value="class">Class Reports</TabsTrigger>
              <TabsTrigger value="export">Export & Print</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Individual Student Reports</h3>
                <div className="flex gap-2">
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Grades</SelectItem>
                      <SelectItem value="6">6th Grade</SelectItem>
                      <SelectItem value="7">7th Grade</SelectItem>
                      <SelectItem value="8">8th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportStudentData(studentData.scholar.id, "excel")}
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToPDF(studentData)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToWord(studentData)}
                            className="flex items-center gap-2"
                          >
                            <File className="h-4 w-4" />
                            Word
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
            </TabsContent>

            <TabsContent value="class" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Class Overview Reports</h3>
                <div className="flex gap-2">
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Grades</SelectItem>
                      <SelectItem value="6">6th Grade</SelectItem>
                      <SelectItem value="7">7th Grade</SelectItem>
                      <SelectItem value="8">8th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleClassPrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Class Report
                  </Button>
                </div>
              </div>

              <div ref={classPrintRef} className="print:p-6">
                <div className="print:block hidden mb-6">
                  <h1 className="text-2xl font-bold text-center">Bush Hills STEAM Academy</h1>
                  <h2 className="text-xl font-semibold text-center">Class PBIS Report - {selectedMonthName} {selectedYear}</h2>
                  <p className="text-center text-gray-600">Grade: {selectedGrade || "All Grades"}</p>
                  <p className="text-center text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
                </div>

                {classData.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found for the selected criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Class Total Positive</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {classData.reduce((sum, data) => sum + data.positivePoints, 0)}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Class Total Negative</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          {classData.reduce((sum, data) => sum + data.negativePoints, 0)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Class Net Points</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {classData.reduce((sum, data) => sum + data.netPoints, 0)}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Students</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {classData.length}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-900">Student Name</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900">Student ID</th>
                              <th className="px-4 py-3 text-center font-medium text-gray-900">Grade</th>
                              <th className="px-4 py-3 text-center font-medium text-gray-900">Positive</th>
                              <th className="px-4 py-3 text-center font-medium text-gray-900">Negative</th>
                              <th className="px-4 py-3 text-center font-medium text-gray-900">Net</th>
                              <th className="px-4 py-3 text-center font-medium text-gray-900">Entries</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classData.map((studentData, index) => (
                              <tr key={studentData.scholar.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 font-medium text-gray-900">{studentData.scholar.name}</td>
                                <td className="px-4 py-3 text-gray-600">{studentData.scholar.studentId}</td>
                                <td className="px-4 py-3 text-center text-gray-600">{studentData.scholar.grade}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-green-600 font-medium">+{studentData.positivePoints}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-red-600 font-medium">-{studentData.negativePoints}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-medium ${studentData.netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {studentData.netPoints >= 0 ? '+' : ''}{studentData.netPoints}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">{studentData.entries.length}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Export & Print Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Individual Student Export */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Individual Student Reports</CardTitle>
                      <CardDescription>Export detailed reports for individual students</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredScholars.map((scholar) => (
                            <SelectItem key={scholar.id} value={scholar.id}>
                              {scholar.name} (Grade {scholar.grade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedStudent && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const studentData = selectedMonthData.find(s => s.scholar.id === selectedStudent);
                              if (studentData) exportToPDF(studentData);
                            }}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const studentData = selectedMonthData.find(s => s.scholar.id === selectedStudent);
                              if (studentData) exportToWord(studentData);
                            }}
                            className="flex items-center gap-2"
                          >
                            <File className="h-4 w-4" />
                            Word
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportStudentData(selectedStudent, "csv")}
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportStudentData(selectedStudent, "excel")}
                            className="flex items-center gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Class Report Export */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Class Reports</CardTitle>
                      <CardDescription>Export comprehensive class overview reports</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Grades</SelectItem>
                          <SelectItem value="6">6th Grade</SelectItem>
                          <SelectItem value="7">7th Grade</SelectItem>
                          <SelectItem value="8">8th Grade</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToPDF(classData, true)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToWord(classData, true)}
                          className="flex items-center gap-2"
                        >
                          <File className="h-4 w-4" />
                          Word
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClassPrint}
                          className="flex items-center gap-2 col-span-2"
                        >
                          <Printer className="h-4 w-4" />
                          Print Class Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="text-base font-semibold mb-3">Export Information</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>PDF:</strong> Professional formatted reports perfect for printing and sharing</li>
                      <li>• <strong>Word:</strong> Editable documents that can be customized before printing</li>
                      <li>• <strong>Excel:</strong> Spreadsheet format ideal for data analysis and calculations</li>
                      <li>• <strong>CSV:</strong> Simple data format that works with any spreadsheet application</li>
                      <li>• <strong>Print:</strong> Direct printing with optimized layout for paper documents</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hidden print component for individual students */}
      <div ref={printComponentRef} className="hidden print:block print:p-6">
        {selectedStudent && selectedMonthData.find(s => s.scholar.id === selectedStudent) && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Bush Hills STEAM Academy</h1>
              <h2 className="text-xl font-semibold">Individual PBIS Report</h2>
              <p className="text-gray-600">Report Period: {selectedMonthName} {selectedYear}</p>
              <p className="text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            
            {(() => {
              const studentData = selectedMonthData.find(s => s.scholar.id === selectedStudent);
              if (!studentData) return null;
              
              return (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">{studentData.scholar.name}</h3>
                    <p className="text-gray-600">
                      Student ID: {studentData.scholar.studentId} | Grade: {studentData.scholar.grade}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm font-medium text-green-800">Positive Points</p>
                      <p className="text-xl font-bold text-green-600">+{studentData.positivePoints}</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm font-medium text-red-800">Negative Points</p>
                      <p className="text-xl font-bold text-red-600">-{studentData.negativePoints}</p>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <p className="text-sm font-medium text-blue-800">Net Points</p>
                      <p className={`text-xl font-bold ${studentData.netPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {studentData.netPoints >= 0 ? '+' : ''}{studentData.netPoints}
                      </p>
                    </div>
                  </div>
                  
                  {studentData.entries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">PBIS Entries ({studentData.entries.length})</h4>
                      <table className="w-full text-sm border-collapse border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border p-2 text-left">Date</th>
                            <th className="border p-2 text-left">Points</th>
                            <th className="border p-2 text-left">Category</th>
                            <th className="border p-2 text-left">Subcategory</th>
                            <th className="border p-2 text-left">MUSTANG Trait</th>
                            <th className="border p-2 text-left">Teacher</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentData.entries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="border p-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                              <td className={`border p-2 font-medium ${entry.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.points >= 0 ? '+' : ''}{entry.points}
                              </td>
                              <td className="border p-2">{entry.category}</td>
                              <td className="border p-2">{entry.subcategory}</td>
                              <td className="border p-2">{entry.mustangTrait}</td>
                              <td className="border p-2">{entry.teacherName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}