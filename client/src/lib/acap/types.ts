export type AcapSubject = "ELA" | "MATH" | "SCI";

export type RankWindow = "BASELINE" | "MIDPOINT" | "FINAL" | "ALL_THREE";

export type GoalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED" | "PAUSED" | "COMPLETED";

export type GoalType = "OUTCOME" | "SKILL" | "PROCESS";

export type StudentRankSummary = {
  subject: AcapSubject;
  window: RankWindow;
  proficiencyRank: number;
  growthRank: number;
  populationN: number;
  proficiencyScore: number;
  growthScore: number;
  updatedAtLabel: string;
};

export type RankDriver = {
  label: string;
  deltaLabel: string;
  detail: string;
};

export type StudentGoal = {
  id: string;
  subject: AcapSubject;
  type: GoalType;
  title: string;
  status: GoalStatus;
  progressPct: number;
  nextStep: string;
  teacherNote?: string;
};

export type TeacherClassRankSummary = {
  subject: AcapSubject;
  window: RankWindow;
  className: string;
  periodLabel?: string;
  proficiencyRank: number;
  growthRank: number;
  totalClassesN: number;
  gradeRank?: number;
  totalGradesN?: number;
};

export type GoalQueueItem = {
  goalId: string;
  studentId: string;
  studentName: string;
  grade: number;
  subject: AcapSubject;
  goalTitle: string;
  status: GoalStatus;
  progressPct: number;
  submittedAtLabel: string;
};

export type AdminRankingRow = {
  id: string;
  label: string;
  proficiencyRank: number;
  growthRank: number;
  proficiencyScore: number;
  growthScore: number;
};

export type RankSettings = {
  window: RankWindow;
  weights: { baseline: number; midpoint: number; final: number };
  tieBreakers: {
    finalLevelFirst: boolean;
    dok34Accuracy: boolean;
    writingEvidence: boolean;
    improvementSlope: boolean;
  };
  populationRules: {
    includeGrades: number[];
    excludeNewEnrollments: boolean;
    useSchoolPopulationOverride: boolean;
    schoolPopulationOverrideN?: number;
  };
};
