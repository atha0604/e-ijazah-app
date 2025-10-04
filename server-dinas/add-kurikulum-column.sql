-- Add kurikulum column to sekolah_master if not exists
ALTER TABLE sekolah_master
ADD COLUMN IF NOT EXISTS kurikulum TEXT;
