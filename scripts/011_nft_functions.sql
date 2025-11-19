-- Function to increment collection minted count
CREATE OR REPLACE FUNCTION increment_collection_minted(
  collection_id UUID,
  increment_by INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.nft_collections
  SET minted_count = minted_count + increment_by,
      updated_at = NOW()
  WHERE id = collection_id;
END;
$$;
