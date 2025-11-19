-- Function to update collection stats after a sale
CREATE OR REPLACE FUNCTION update_collection_stats(
  collection_id UUID,
  sale_price DECIMAL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_floor DECIMAL;
BEGIN
  -- Update total volume
  UPDATE public.nft_collections
  SET total_volume = total_volume + sale_price,
      updated_at = NOW()
  WHERE id = collection_id;

  -- Update floor price (minimum current_price of listed NFTs)
  SELECT MIN(current_price)
  INTO current_floor
  FROM public.music_nfts
  WHERE collection_id = collection_id
    AND is_listed = true
    AND current_price IS NOT NULL;

  UPDATE public.nft_collections
  SET floor_price = current_floor
  WHERE id = collection_id;
END;
$$;
