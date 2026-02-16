import { useState, useMemo } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Printer, FileText } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function sanitizeText(text: any): string {
  if (!text) return "";
  return String(text)
    .replace(/[\u00D8\u00DC\u00D6]/g, "")
    .replace(/[^\x20-\x7E\u00A0-\u024F\n\r\t]/g, "")
    .trim();
}

function renderLatexContent(text: string) {
  if (!text) return null;
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const latex = part.slice(2, -2);
      try { return <BlockMath key={i} math={latex} />; } catch { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      const latex = part.slice(1, -1);
      try { return <InlineMath key={i} math={latex} />; } catch { return <span key={i}>{part}</span>; }
    }
    return <span key={i}>{sanitizeText(part)}</span>;
  });
}

interface WorksheetItem {
  stem: string;
  passage?: string;
  diagramDescription?: string;
  options: Record<string, string>;
  correctAnswer: string;
  rationale: string;
  type?: string;
  passageReference?: string;
  sampleAnswer?: string;
  rubric?: string;
  linesProvided?: number;
  visual?: any;
  correctAnswers?: string[];
}

interface PreviewProps {
  items: WorksheetItem[];
  title: string;
  subject: string;
  grade: number;
  standardCode: string;
  dokLevel: number;
  usedFallback?: boolean;
}

export default function ProfessionalWorksheetPreview({ items, title, subject, grade, standardCode, dokLevel, usedFallback }: PreviewProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  const passage = useMemo(() => items.find(i => i.passage)?.passage, [items]);

  return (
    <div className="worksheet-preview-container">
      <div className="worksheet-preview-header">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">{sanitizeText(title)}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{subject}</Badge>
              <Badge variant="outline" className="text-xs">Grade {grade}</Badge>
              <Badge variant="outline" className="text-xs">DOK {dokLevel}</Badge>
              <Badge variant="outline" className="text-xs">{standardCode}</Badge>
              {usedFallback && <Badge variant="destructive" className="text-xs">Template Mode</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? <><EyeOff className="w-4 h-4 mr-1" /> Hide Answers</> : <><Eye className="w-4 h-4 mr-1" /> Show Answers</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
        </div>

        <div className="worksheet-student-info">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>Name: <span className="border-b border-gray-400 inline-block w-40"></span></div>
            <div>Date: <span className="border-b border-gray-400 inline-block w-32"></span></div>
            <div>Period: <span className="border-b border-gray-400 inline-block w-20"></span></div>
          </div>
        </div>
      </div>

      {passage && (
        <Card className="worksheet-passage-card">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900 font-serif">Reading Passage</h3>
          </div>
          <div className="worksheet-passage-text">
            {sanitizeText(passage).split('\n').map((para, i) => (
              <p key={i} className="mb-3 text-gray-800 leading-relaxed">{para}</p>
            ))}
          </div>
        </Card>
      )}

      <div className="worksheet-questions-container">
        {items.map((item, idx) => (
          <div key={idx} className="worksheet-question-block">
            <div className="worksheet-question-number">{idx + 1}</div>
            <div className="worksheet-question-content">
              <div className="worksheet-question-stem">
                {renderLatexContent(item.stem)}
              </div>

              {item.passageReference && (
                <p className="text-xs text-indigo-600 italic mt-1">({sanitizeText(item.passageReference)})</p>
              )}

              {item.visual && <VisualRenderer visual={item.visual} />}

              {item.diagramDescription && !item.visual && (
                <div className="worksheet-diagram-desc">
                  <p className="text-xs text-gray-600 italic">[Diagram: {sanitizeText(item.diagramDescription)}]</p>
                </div>
              )}

              {(item.type === "multiple_choice" || item.type === "multiple_select" || !item.type) && item.options && Object.keys(item.options).length > 0 && (
                <div className="worksheet-options">
                  {Object.entries(item.options).map(([key, val]) => {
                    const isCorrect = item.correctAnswer?.includes(key) || item.correctAnswers?.includes(key);
                    return (
                      <div key={key} className={`worksheet-option ${showAnswers && isCorrect ? 'worksheet-option-correct' : ''}`}>
                        <span className="worksheet-option-letter">{key}</span>
                        <span className="worksheet-option-text">{renderLatexContent(String(val))}</span>
                      </div>
                    );
                  })}
                  {item.type === "multiple_select" && (
                    <p className="text-xs text-gray-500 italic mt-1">Select all that apply.</p>
                  )}
                </div>
              )}

              {(item.type === "short_response" || item.type === "text_dependent_writing") && (
                <div className="worksheet-response-area">
                  {Array.from({ length: item.linesProvided || 6 }).map((_, i) => (
                    <div key={i} className="worksheet-response-line"></div>
                  ))}
                </div>
              )}

              {showAnswers && (
                <div className="worksheet-answer-reveal">
                  <div className="text-sm">
                    <span className="font-bold text-green-800">Answer: </span>
                    <span className="text-green-700">{sanitizeText(item.correctAnswer)}</span>
                  </div>
                  {item.rationale && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Rationale: </span>{sanitizeText(item.rationale)}
                    </div>
                  )}
                  {item.sampleAnswer && (
                    <div className="text-xs text-blue-700 mt-1">
                      <span className="font-semibold">Sample: </span>{sanitizeText(item.sampleAnswer)}
                    </div>
                  )}
                  {item.rubric && (
                    <div className="text-xs text-purple-700 mt-1">
                      <span className="font-semibold">Rubric: </span>{sanitizeText(item.rubric)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="worksheet-preview-footer">
        <p className="text-xs text-gray-400 text-center">
          EduCAP Worksheet | Bush Hills STEAM Academy | {subject} Grade {grade} | {standardCode} | DOK {dokLevel}
        </p>
      </div>
    </div>
  );
}

function VisualRenderer({ visual }: { visual: any }) {
  if (!visual || !visual.type) return null;
  const v = visual;
  const type = v.type;

  return (
    <div className="worksheet-visual-container">
      {v.title && <p className="text-sm font-bold text-gray-800 mb-2">{sanitizeText(v.title)}</p>}

      {type === "table" && v.columns && v.rows && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {v.columns.map((col: string, i: number) => (
                  <th key={i} className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-800">{sanitizeText(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.rows.map((row: string[], ri: number) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} className="border border-gray-300 px-3 py-2 text-gray-700">{renderLatexContent(String(cell))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(type === "bar_chart" || type === "bar") && v.labels && v.values && (
        <div className="bg-white border border-gray-300 p-4 max-w-md">
          <Bar data={buildChartData(v)} options={chartOptions(v)} />
        </div>
      )}

      {(type === "line" || type === "line_chart") && v.labels && v.values && (
        <div className="bg-white border border-gray-300 p-4 max-w-md">
          <Line data={buildChartData(v)} options={chartOptions(v)} />
        </div>
      )}

      {type === "number_line" && v.points && (
        <div className="bg-white border border-gray-300 p-4">
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
            <span className="font-mono">{v.min ?? -5}</span>
            <div className="flex-1 h-0.5 bg-gray-800 relative">
              {v.points.map((pt: any, i: number) => {
                const min = v.min ?? -5;
                const max = v.max ?? 5;
                const pct = ((Number(pt.value) - min) / (max - min)) * 100;
                return (
                  <div key={i} className="absolute -top-2 flex flex-col items-center" style={{ left: `${pct}%` }}>
                    <span className="text-xs font-bold text-indigo-600 mb-0.5">{sanitizeText(pt.label)}</span>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                );
              })}
            </div>
            <span className="font-mono">{v.max ?? 5}</span>
          </div>
        </div>
      )}

      {type === "coordinate_plane" && v.points && (
        <div className="bg-white border border-gray-300 p-3">
          <table className="text-xs">
            <thead>
              <tr><th className="border border-gray-300 px-2 py-1">Point</th><th className="border border-gray-300 px-2 py-1">Coordinates</th></tr>
            </thead>
            <tbody>
              {v.points.map((pt: any, i: number) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-2 py-1 font-semibold">{sanitizeText(pt.label || `P${i+1}`)}</td>
                  <td className="border border-gray-300 px-2 py-1">({pt.x}, {pt.y})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function buildChartData(v: any) {
  return {
    labels: (v.labels || []).map(sanitizeText),
    datasets: [{
      label: sanitizeText(v.title || ""),
      data: (v.values || []).map((n: any) => Number(n)),
      backgroundColor: ['rgba(99, 102, 241, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)'],
      borderColor: ['rgb(99, 102, 241)', 'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
      borderWidth: 1,
    }],
  };
}

function chartOptions(v: any) {
  return {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: !!v.title, text: sanitizeText(v.title || ""), font: { size: 14 } },
    },
    scales: { y: { beginAtZero: true } },
  };
}
