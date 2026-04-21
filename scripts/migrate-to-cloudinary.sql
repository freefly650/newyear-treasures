-- Run this ONLY if you have an existing dolls table with image_data/image_content_type
-- and want to switch to Cloudinary (image_url only).
-- After migrating existing images to Cloudinary and populating image_url, run:
--
--   psql $DATABASE_URL -f scripts/migrate-to-cloudinary.sql
--
-- 1. Add new column
ALTER TABLE dolls ADD COLUMN IF NOT EXISTS image_url TEXT;
-- 2. (Optional) Backfill image_url from your migration script that uploads to Cloudinary.
-- 3. Drop old columns
ALTER TABLE dolls DROP COLUMN IF EXISTS image_data;
ALTER TABLE dolls DROP COLUMN IF EXISTS image_content_type;
