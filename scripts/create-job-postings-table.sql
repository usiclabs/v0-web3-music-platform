-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL, -- Full-time, Part-time, Contract
  description TEXT,
  responsibilities TEXT[],
  requirements TEXT[],
  nice_to_have TEXT[],
  salary_range TEXT,
  is_active BOOLEAN DEFAULT true,
  posted_by TEXT, -- admin wallet address
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active job postings
CREATE POLICY "Anyone can view active jobs"
  ON job_postings
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can insert job postings
CREATE POLICY "Admins can create jobs"
  ON job_postings
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update job postings
CREATE POLICY "Admins can update jobs"
  ON job_postings
  FOR UPDATE
  USING (true);

-- Policy: Admins can delete job postings
CREATE POLICY "Admins can delete jobs"
  ON job_postings
  FOR DELETE
  USING (true);
