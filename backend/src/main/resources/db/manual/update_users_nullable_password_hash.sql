-- Migration to support Google OAuth login by making password_hash nullable.
-- Also ensures that auth_provider exists, backfills existing NULL values to 'LOCAL', and ensures google_id index is present.

-- 1. Ensure auth_provider exists and existing null values become 'LOCAL'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
        ALTER TABLE users ADD COLUMN auth_provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL';
    END IF;
END $$;

UPDATE users SET auth_provider = 'LOCAL' WHERE auth_provider IS NULL;

-- 2. Drop the NOT NULL constraint on password_hash to allow OAuth users without a password
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Ensure google_id exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
    END IF;
END $$;

-- 4. Create a unique partial index on google_id where google_id is not null
DROP INDEX IF EXISTS idx_users_google_id_unique;
CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
