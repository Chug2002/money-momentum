CREATE TABLE IF NOT EXISTS auth_users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS auth_credentials(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES auth_users(id),public_key TEXT NOT NULL,counter INTEGER NOT NULL,transports TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_invites(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES auth_users(id),expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS auth_challenges(id TEXT PRIMARY KEY,challenge TEXT NOT NULL,kind TEXT NOT NULL,user_id TEXT,invite_hash TEXT,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES auth_users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_rates(bucket TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires);
CREATE INDEX IF NOT EXISTS auth_challenges_expiry ON auth_challenges(expires);
