CREATE TABLE IF NOT EXISTS progress_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR NOT NULL,
  report_type VARCHAR NOT NULL,
  generated_by VARCHAR NOT NULL,
  report_data JSONB NOT NULL,
  date_range JSONB NOT NULL,
  total_pbis_points INTEGER NOT NULL DEFAULT 0,
  academic_grade VARCHAR,
  behavior_grade VARCHAR,
  attendance_rate INTEGER DEFAULT 100,
  recommended_actions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR NOT NULL,
  recommendation_type VARCHAR NOT NULL,
  priority VARCHAR NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_items TEXT[] DEFAULT '{}',
  target_skills TEXT[] DEFAULT '{}',
  estimated_duration INTEGER,
  confidence INTEGER DEFAULT 0,
  ai_reasoning TEXT,
  implemented_by VARCHAR,
  implemented_at TIMESTAMP,
  effectiveness_rating INTEGER,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
