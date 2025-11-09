-- Migration 0001: Initial schema
-- Create app_version table

CREATE TABLE IF NOT EXISTS app_version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    build_number INTEGER NOT NULL,
    platform TEXT NOT NULL, -- 'web', 'android', 'ios'
    release_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_current INTEGER DEFAULT 0, -- 0 = false, 1 = true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_version_current ON app_version(is_current);
CREATE INDEX IF NOT EXISTS idx_app_version_platform ON app_version(platform);

-- Insert initial test data
INSERT INTO app_version (version, build_number, platform, notes, is_current) 
VALUES ('1.0.0', 1, 'web', 'Initial release', 1);

