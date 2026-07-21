-- SehatAI Database Schema
-- Run with: supabase db push

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (MOs, ASHA, Doctors)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mo', 'asha', 'doctor', 'admin')),
  phc_id UUID,
  abha_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHC Centers
CREATE TABLE phc_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  block TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  abha_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  date_of_birth DATE,
  age INTEGER,
  phone TEXT,
  address TEXT,
  phc_id UUID REFERENCES phc_centers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encounters
CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  phc_id UUID REFERENCES phc_centers(id),
  doctor_id UUID REFERENCES users(id),
  encounter_date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT CHECK (type IN ('opd', 'emergency', 'followup', 'telemedicine')),
  chief_complaint TEXT,
  diagnosis TEXT[],
  medications JSONB,
  vitals JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triage Sessions
CREATE TABLE triage_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  intake_id UUID REFERENCES users(id), -- nurse/ASHA who did intake
  intake_data JSONB NOT NULL,
  patient_context JSONB,
  differential_diagnoses JSONB,
  red_flags JSONB,
  suggested_actions JSONB,
  clinical_summary TEXT,
  model_used TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'reviewed', 'finalized', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

-- Doctor Overrides
CREATE TABLE doctor_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triage_session_id UUID REFERENCES triage_sessions(id),
  doctor_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'reject', 'reorder', 'add')),
  original_diagnosis JSONB,
  modified_diagnosis JSONB,
  reason TEXT,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Summaries
CREATE TABLE clinical_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  triage_session_id UUID REFERENCES triage_sessions(id),
  one_liner TEXT,
  active_problems JSONB,
  red_flags JSONB,
  chronic_snapshot JSONB,
  medications JSONB,
  missing_data TEXT[],
  encounter_count INTEGER,
  last_encounter_days INTEGER,
  eval_score DECIMAL(3,1),
  eval_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
};

-- Doctor Overrides
CREATE TABLE doctor_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triage_session_id UUID REFERENCES triage_sessions(id),
  doctor_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'reject', 'reorder', 'add')),
  original_diagnosis JSONB,
  modified_diagnosis JSONB,
  reason TEXT,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ABHA Writebacks
CREATE TABLE abha_writebacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  triage_session_id UUID REFERENCES triage_sessions(id),
  patient_id UUID REFERENCES patients(id),
  consent_id TEXT,
  composition_id TEXT,
  record_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Sessions
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  step INTEGER,
  step_name TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  practice_data JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE phc_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE abha_writebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own data and patients in their PHC
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view patients in their PHC" ON patients
  FOR SELECT USING (
    phc_id IN (SELECT phc_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Doctors can view triage sessions in their PHC" ON triage_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'doctor'
      AND u.phc_id = (
        SELECT phc_id FROM patients p WHERE p.id = triage_sessions.patient_id
      )
    )
  );

CREATE POLICY "Nurses/ASHA can insert triage sessions" ON triage_sessions
  FOR INSERT WITH CHECK (
    intake_id = auth.uid()
  );

CREATE POLICY "Doctors can update triage sessions" ON triage_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can insert overrides" ON doctor_overrides
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid()
  );

-- Indexes
CREATE INDEX idx_patients_abha_id ON patients(abha_id);
CREATE INDEX idx_patients_phc_id ON patients(phc_id);
CREATE INDEX idx_triage_sessions_patient_id ON triage_sessions(patient_id);
CREATE INDEX idx_triage_sessions_status ON triage_sessions(status);
CREATE INDEX idx_triage_sessions_created_at ON triage_sessions(created_at DESC);
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_date ON encounters(encounter_date DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample PHC centers
INSERT INTO phc_centers (name, code, state, district, block, address, latitude, longitude) VALUES
('PHC Rampur', 'PHC_RAM_001', 'Maharashtra', 'Nashik', 'Sinnar', 'Rampur Village, Sinnar Taluka', 19.8565, 73.9582),
('PHC Sinnar', 'PHC_SIN_002', 'Maharashtra', 'Nashik', 'Sinnar', 'Sinnar Town, Near Bus Stand', 19.8542, 73.9567),
('PHC Yeola', 'PHC_YEO_003', 'Maharashtra', 'Nashik', 'Yeola', 'Yeola City, Near Civil Hospital', 19.9333, 74.4833);

-- Insert sample users (passwords would be set via Supabase Auth)
INSERT INTO users (email, full_name, role, phc_id, is_active) VALUES
('dr.rajesh@phc.gov.in', 'Dr. Rajesh Kumar', 'doctor', (SELECT id FROM phc_centers WHERE code = 'PHC_RAM_001'), true),
('nurse.priya@phc.gov.in', 'Priya Sharma', 'asha', (SELECT id FROM phc_centers WHERE code = 'PHC_RAM_001'), true),
('asha.sunita@phc.gov.in', 'Sunita Devi', 'asha', (SELECT id FROM phc_centers WHERE code = 'PHC_SIN_002'), true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE triage_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE clinical_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE doctor_overrides;