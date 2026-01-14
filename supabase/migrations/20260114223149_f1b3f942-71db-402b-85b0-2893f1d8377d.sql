-- Add deleted_at column for soft delete functionality
ALTER TABLE mentorados_roteiros 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance on deleted_at queries
CREATE INDEX idx_mentorados_roteiros_deleted_at 
ON mentorados_roteiros(deleted_at);