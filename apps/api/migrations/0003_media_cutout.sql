ALTER TABLE wardrobe_items
  ADD COLUMN IF NOT EXISTS cutout_uri varchar(1024),
  ADD COLUMN IF NOT EXISTS image_processing_state varchar(24) NOT NULL DEFAULT 'NONE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wardrobe_items_image_processing_state_check'
  ) THEN
    ALTER TABLE wardrobe_items
      ADD CONSTRAINT wardrobe_items_image_processing_state_check
      CHECK (image_processing_state IN ('NONE', 'PENDING_CUTOUT', 'CUTOUT_READY', 'CUTOUT_FAILED'));
  END IF;
END $$;
