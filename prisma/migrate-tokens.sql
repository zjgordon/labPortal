-- Migration script to update existing hosts to use hashed tokens
-- This script should be run after the schema migration

-- For existing hosts with agentToken, we need to:
-- 1. Generate a hash for the existing token
-- 2. Extract the prefix
-- 3. Set tokenRotatedAt to a reasonable default

-- Note: This is a placeholder migration. In production, you would:
-- 1. Run the schema migration first
-- 2. Then run this data migration
-- 3. Finally, rotate all tokens to ensure security

-- Example of what the migration would look like:
/*
-- This would be run in a Node.js script, not directly in SQL
-- because we need to hash the existing tokens

UPDATE hosts 
SET 
  agentTokenHash = 'hash_of_existing_token',
  agentTokenPrefix = 'prefix_of_existing_token',
  tokenRotatedAt = '2025-09-03T00:00:00Z'
WHERE agentToken IS NOT NULL;

-- After migration, set agentToken to NULL
UPDATE hosts SET agentToken = NULL WHERE agentToken IS NOT NULL;
*/

-- For now, this is just a placeholder to document the migration process
