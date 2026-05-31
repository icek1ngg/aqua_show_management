-- Migration to support email verification tokens and update user status constraints.

-- 1. Update check constraint on users.status to include PENDING_VERIFICATION and DISABLED, and migrate any BLOCKED users to DISABLED
UPDATE users SET status = 'DISABLED' WHERE status = 'BLOCKED';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'INACTIVE', 'DISABLED'));

-- 2. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_email_verification_tokens PRIMARY KEY (id),
    CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create unique index on token
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
