-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Profiles policies (permissive for MVP - everyone can read, anyone can create/update their own)
CREATE POLICY "profiles_select_all" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (true);

-- Tracks policies (everyone can read, artists can manage their own)
CREATE POLICY "tracks_select_all" ON public.tracks 
  FOR SELECT USING (true);

CREATE POLICY "tracks_insert_all" ON public.tracks 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tracks_update_own" ON public.tracks 
  FOR UPDATE USING (true);

CREATE POLICY "tracks_delete_own" ON public.tracks 
  FOR DELETE USING (true);

-- Royalty splits policies (everyone can read, track owners can manage)
CREATE POLICY "royalty_splits_select_all" ON public.royalty_splits 
  FOR SELECT USING (true);

CREATE POLICY "royalty_splits_insert_all" ON public.royalty_splits 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "royalty_splits_update_all" ON public.royalty_splits 
  FOR UPDATE USING (true);

CREATE POLICY "royalty_splits_delete_all" ON public.royalty_splits 
  FOR DELETE USING (true);

-- Streams policies (everyone can read and write for analytics)
CREATE POLICY "streams_select_all" ON public.streams 
  FOR SELECT USING (true);

CREATE POLICY "streams_insert_all" ON public.streams 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "streams_update_all" ON public.streams 
  FOR UPDATE USING (true);
