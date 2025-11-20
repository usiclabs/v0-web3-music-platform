-- Studio Projects Schema
-- Manages DAW projects, tracks, stems, automation, samples, and versions

-- Studio projects table
CREATE TABLE IF NOT EXISTS studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  bpm INTEGER NOT NULL DEFAULT 120,
  time_signature TEXT NOT NULL DEFAULT '4/4',
  key_signature TEXT DEFAULT 'C',
  duration_seconds INTEGER DEFAULT 0,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studio tracks (individual lanes in timeline)
CREATE TABLE IF NOT EXISTS studio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  track_type TEXT NOT NULL CHECK (track_type IN ('audio', 'midi', 'bus', 'master')),
  color TEXT NOT NULL DEFAULT '#ef4444',
  position INTEGER NOT NULL DEFAULT 0,
  volume REAL NOT NULL DEFAULT 0.7,
  pan REAL NOT NULL DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  is_soloed BOOLEAN DEFAULT false,
  is_armed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio regions (clips on timeline)
CREATE TABLE IF NOT EXISTS studio_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES studio_tracks(id) ON DELETE CASCADE,
  region_type TEXT NOT NULL CHECK (region_type IN ('audio', 'midi')),
  name TEXT NOT NULL,
  start_time REAL NOT NULL,
  duration REAL NOT NULL,
  offset REAL DEFAULT 0,
  audio_url TEXT,
  midi_data JSONB,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIDI notes
CREATE TABLE IF NOT EXISTS studio_midi_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES studio_regions(id) ON DELETE CASCADE,
  note_number INTEGER NOT NULL CHECK (note_number >= 0 AND note_number <= 127),
  velocity INTEGER NOT NULL DEFAULT 100 CHECK (velocity >= 0 AND velocity <= 127),
  start_time REAL NOT NULL,
  duration REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation lanes
CREATE TABLE IF NOT EXISTS studio_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES studio_tracks(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  points JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Effects chain
CREATE TABLE IF NOT EXISTS studio_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES studio_tracks(id) ON DELETE CASCADE,
  effect_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  parameters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample library
CREATE TABLE IF NOT EXISTS studio_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  audio_url TEXT NOT NULL,
  duration REAL NOT NULL,
  bpm INTEGER,
  key_signature TEXT,
  uploader_address TEXT REFERENCES profiles(wallet_address) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project versions (save history)
CREATE TABLE IF NOT EXISTS studio_project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  snapshot_data JSONB NOT NULL,
  created_by TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborators
CREATE TABLE IF NOT EXISTS studio_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  collaborator_address TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  invited_by TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, collaborator_address)
);

-- Exported tracks (final renders)
CREATE TABLE IF NOT EXISTS studio_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  exported_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  export_format TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration REAL NOT NULL,
  file_size_bytes BIGINT,
  exported_by TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_studio_projects_creator ON studio_projects(creator_address);
CREATE INDEX IF NOT EXISTS idx_studio_tracks_project ON studio_tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_regions_track ON studio_regions(track_id);
CREATE INDEX IF NOT EXISTS idx_studio_midi_notes_region ON studio_midi_notes(region_id);
CREATE INDEX IF NOT EXISTS idx_studio_automation_track ON studio_automation(track_id);
CREATE INDEX IF NOT EXISTS idx_studio_effects_track ON studio_effects(track_id);
CREATE INDEX IF NOT EXISTS idx_studio_samples_category ON studio_samples(category);
CREATE INDEX IF NOT EXISTS idx_studio_versions_project ON studio_project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_collaborators_project ON studio_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_exports_project ON studio_exports(project_id);

-- RLS Policies
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_midi_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_exports ENABLE ROW LEVEL SECURITY;

-- Projects: users can view their own or public projects
CREATE POLICY "Users can view own or public projects"
  ON studio_projects FOR SELECT
  USING (is_public = true OR creator_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Projects: users can create their own projects
CREATE POLICY "Users can create own projects"
  ON studio_projects FOR INSERT
  WITH CHECK (creator_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Projects: users can update their own projects
CREATE POLICY "Users can update own projects"
  ON studio_projects FOR UPDATE
  USING (creator_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Projects: users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON studio_projects FOR DELETE
  USING (creator_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Tracks: users can manage tracks in their projects
CREATE POLICY "Users can manage tracks in own projects"
  ON studio_tracks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_projects 
    WHERE id = studio_tracks.project_id 
    AND creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Regions: users can manage regions in their tracks
CREATE POLICY "Users can manage regions in own tracks"
  ON studio_regions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_tracks t
    JOIN studio_projects p ON t.project_id = p.id
    WHERE t.id = studio_regions.track_id 
    AND p.creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- MIDI notes: users can manage notes in their regions
CREATE POLICY "Users can manage midi notes in own regions"
  ON studio_midi_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_regions r
    JOIN studio_tracks t ON r.track_id = t.id
    JOIN studio_projects p ON t.project_id = p.id
    WHERE r.id = studio_midi_notes.region_id 
    AND p.creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Automation: users can manage automation in their tracks
CREATE POLICY "Users can manage automation in own tracks"
  ON studio_automation FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_tracks t
    JOIN studio_projects p ON t.project_id = p.id
    WHERE t.id = studio_automation.track_id 
    AND p.creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Effects: users can manage effects in their tracks
CREATE POLICY "Users can manage effects in own tracks"
  ON studio_effects FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_tracks t
    JOIN studio_projects p ON t.project_id = p.id
    WHERE t.id = studio_effects.track_id 
    AND p.creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Samples: anyone can view public samples
CREATE POLICY "Anyone can view public samples"
  ON studio_samples FOR SELECT
  USING (is_public = true OR uploader_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Samples: users can upload samples
CREATE POLICY "Users can upload samples"
  ON studio_samples FOR INSERT
  WITH CHECK (uploader_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Versions: users can manage versions of their projects
CREATE POLICY "Users can manage versions of own projects"
  ON studio_project_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_projects 
    WHERE id = studio_project_versions.project_id 
    AND creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Collaborators: project owners and collaborators can view
CREATE POLICY "Collaborators can view"
  ON studio_collaborators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM studio_projects 
    WHERE id = studio_collaborators.project_id 
    AND (creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
         OR collaborator_address = current_setting('request.jwt.claims', true)::json->>'sub')
  ));

-- Collaborators: project owners can manage
CREATE POLICY "Project owners can manage collaborators"
  ON studio_collaborators FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_projects 
    WHERE id = studio_collaborators.project_id 
    AND creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Exports: users can manage exports of their projects
CREATE POLICY "Users can manage exports of own projects"
  ON studio_exports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM studio_projects 
    WHERE id = studio_exports.project_id 
    AND creator_address = current_setting('request.jwt.claims', true)::json->>'sub'
  ));
