-- Migration 017: capture visitor IP address on site_visits
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64) DEFAULT NULL;
