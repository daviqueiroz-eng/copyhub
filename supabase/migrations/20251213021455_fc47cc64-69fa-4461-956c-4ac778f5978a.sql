-- Add link_video column to grupos_membros_virais table
ALTER TABLE grupos_membros_virais 
ADD COLUMN IF NOT EXISTS link_video TEXT;