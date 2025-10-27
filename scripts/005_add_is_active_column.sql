-- Add is_active column to tracks table for soft delete functionality
ALTER TABLE public.tracks
ADD COLUMN is_active boolean DEFAULT true NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_tracks_is_active ON public.tracks(is_active);

-- Add comment
COMMENT ON COLUMN public.tracks.is_active IS 'Indicates if the track is active/visible. False means hidden by artist.';
