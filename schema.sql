-- Fine Bearing Review Tracker - Supabase PostgreSQL Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS review_confirmations CASCADE;
DROP TABLE IF EXISTS review_clicks CASCADE;
DROP TABLE IF EXISTS qr_sessions CASCADE;
DROP TABLE IF EXISTS monthly_targets CASCADE;
DROP TABLE IF EXISTS counters CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. Settings Table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default Google Review URL
INSERT INTO settings (key, value) VALUES 
('GOOGLE_REVIEW_URL', 'https://g.page/r/CRugrGmMaUE2EAE/review');

-- 2. Admin Users Table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Stored as string for custom validation compatibility
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default admin user (admin@finebearing.com / admin123)
INSERT INTO admin_users (email, password) VALUES 
('admin@finebearing.com', 'admin123');

-- 3. Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passcode TEXT NOT NULL, -- PIN / Passcode for employee dashboard login (e.g. "1234")
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Counters Table
CREATE TABLE counters (
    id TEXT PRIMARY KEY, -- User-friendly ID e.g., 'billing', 'counter-1'
    name TEXT NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Monthly Targets Table
CREATE TABLE monthly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    counter_id TEXT REFERENCES counters(id) ON DELETE CASCADE,
    target_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., '2026-06')
    target_reviews INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_employee_counter_month UNIQUE (employee_id, counter_id, target_month)
);

-- 6. QR Sessions Table (Scans)
CREATE TABLE qr_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counter_id TEXT REFERENCES counters(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- 7. Review Clicks Table (Clicks on Google Review button)
CREATE TABLE review_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_session_id UUID REFERENCES qr_sessions(id) ON DELETE SET NULL,
    counter_id TEXT REFERENCES counters(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    clicked_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Review Confirmations Table (Self-confirmations by customers)
CREATE TABLE review_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_session_id UUID REFERENCES qr_sessions(id) ON DELETE SET NULL,
    counter_id TEXT REFERENCES counters(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    customer_name TEXT,
    confirmed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security) and configure public access
-- Since customers need to log scans, click reviews and submit confirmations without being logged in:
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_confirmations ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public reads for settings & counters to run the landing page, and public inserts for logs)
CREATE POLICY "Allow public read of settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public read of counters" ON counters FOR SELECT USING (true);
CREATE POLICY "Allow public read of employees" ON employees FOR SELECT USING (true);

CREATE POLICY "Allow public insert of qr_sessions" ON qr_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert of review_clicks" ON review_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert of review_confirmations" ON review_confirmations FOR INSERT WITH CHECK (true);

-- Enable full admin bypass or admin policy (for simplicity in our next.js code, we can bypass RLS for dashboard queries using service role or write open policies for demo dashboard reads)
CREATE POLICY "Allow full select for qr_sessions" ON qr_sessions FOR SELECT USING (true);
CREATE POLICY "Allow full select for review_clicks" ON review_clicks FOR SELECT USING (true);
CREATE POLICY "Allow full select for review_confirmations" ON review_confirmations FOR SELECT USING (true);
CREATE POLICY "Allow full CRUD for admin_users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Allow full CRUD for employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow full CRUD for counters" ON counters FOR ALL USING (true);
CREATE POLICY "Allow full CRUD for monthly_targets" ON monthly_targets FOR ALL USING (true);
CREATE POLICY "Allow full CRUD for settings" ON settings FOR ALL USING (true);

-- --- SAMPLE DUMMY DATA ---

-- Insert 5 Employees
-- Passcodes are simple numbers for employee dashboard access
INSERT INTO employees (id, name, email, passcode, active) VALUES
('e1111111-1111-1111-1111-111111111111', 'Amit Sharma', 'amit@finebearing.com', '1001', true),
('e2222222-2222-2222-2222-222222222222', 'Priya Patel', 'priya@finebearing.com', '1002', true),
('e3333333-3333-3333-3333-333333333333', 'Rahul Verma', 'rahul@finebearing.com', '1003', true),
('e4444444-4444-4444-4444-444444444444', 'Vikram Singh', 'vikram@finebearing.com', '1004', true),
('e5555555-5555-5555-5555-555555555555', 'Neha Gupta', 'neha@finebearing.com', '1005', true);

-- Insert 5 Counters
INSERT INTO counters (id, name, employee_id, active) VALUES
('counter-1', 'Main Billing Counter', 'e1111111-1111-1111-1111-111111111111', true),
('counter-2', 'Oil Seals Section', 'e2222222-2222-2222-2222-222222222222', true),
('counter-3', 'Ball Bearings Desk', 'e3333333-3333-3333-3333-333333333333', true),
('counter-4', 'Heavy Bearings Counter', 'e4444444-4444-4444-4444-444444444444', true),
('counter-5', 'Express Pickup Window', 'e5555555-5555-5555-5555-555555555555', true);

-- Insert Monthly Targets for June 2026
INSERT INTO monthly_targets (employee_id, counter_id, target_month, target_reviews) VALUES
('e1111111-1111-1111-1111-111111111111', 'counter-1', '2026-06', 50),
('e2222222-2222-2222-2222-222222222222', 'counter-2', '2026-06', 30),
('e3333333-3333-3333-3333-333333333333', 'counter-3', '2026-06', 40),
('e4444444-4444-4444-4444-444444444444', 'counter-4', '2026-06', 25),
('e5555555-5555-5555-5555-555555555555', 'counter-5', '2026-06', 35);

-- Insert Sample QR Sessions (Scans) spread over today (2026-06-25), yesterday, and this week
-- Counter 1
INSERT INTO qr_sessions (id, counter_id, employee_id, scanned_at) VALUES
('s1010101-1010-1010-1010-101010101010', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-25 09:15:00+05:30'),
('s1010101-1010-1010-1010-101010101011', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-25 10:20:00+05:30'),
('s1010101-1010-1010-1010-101010101012', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-25 10:45:00+05:30'),
('s1010101-1010-1010-1010-101010101013', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-24 14:30:00+05:30'),
('s1010101-1010-1010-1010-101010101014', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-24 16:15:00+05:30');

-- Counter 2
INSERT INTO qr_sessions (id, counter_id, employee_id, scanned_at) VALUES
('s2020202-2020-2020-2020-202020202020', 'counter-2', 'e2222222-2222-2222-2222-222222222222', '2026-06-25 09:30:00+05:30'),
('s2020202-2020-2020-2020-202020202021', 'counter-2', 'e2222222-2222-2222-2222-222222222222', '2026-06-25 10:05:00+05:30'),
('s2020202-2020-2020-2020-202020202022', 'counter-2', 'e2222222-2222-2222-2222-222222222222', '2026-06-23 11:10:00+05:30');

-- Counter 3
INSERT INTO qr_sessions (id, counter_id, employee_id, scanned_at) VALUES
('s3030303-3030-3030-3030-303030303030', 'counter-3', 'e3333333-3333-3333-3333-333333333333', '2026-06-25 08:45:00+05:30'),
('s3030303-3030-3030-3030-303030303031', 'counter-3', 'e3333333-3333-3333-3333-333333333333', '2026-06-24 15:00:00+05:30');

-- Insert Sample Review Clicks (Google Review button clicks)
-- Counter 1
INSERT INTO review_clicks (qr_session_id, counter_id, employee_id, clicked_at) VALUES
('s1010101-1010-1010-1010-101010101010', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-25 09:16:00+05:30'),
('s1010101-1010-1010-1010-101010101011', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-25 10:21:00+05:30'),
('s1010101-1010-1010-1010-101010101013', 'counter-1', 'e1111111-1111-1111-1111-111111111111', '2026-06-24 14:31:00+05:30');

-- Counter 2
INSERT INTO review_clicks (qr_session_id, counter_id, employee_id, clicked_at) VALUES
('s2020202-2020-2020-2020-202020202020', 'counter-2', 'e2222222-2222-2222-2222-222222222222', '2026-06-25 09:31:00+05:30'),
('s2020202-2020-2020-2020-202020202022', 'counter-2', 'e2222222-2222-2222-2222-222222222222', '2026-06-23 11:12:00+05:30');

-- Counter 3
INSERT INTO review_clicks (qr_session_id, counter_id, employee_id, clicked_at) VALUES
('s3030303-3030-3030-3030-303030303030', 'counter-3', 'e3333333-3333-3333-3333-333333333333', '2026-06-25 08:46:00+05:30');

-- Insert Sample Review Confirmations (Customer self-confirmations)
-- Counter 1
INSERT INTO review_confirmations (qr_session_id, counter_id, employee_id, customer_name, confirmed_at) VALUES
('s1010101-1010-1010-1010-101010101010', 'counter-1', 'e1111111-1111-1111-1111-111111111111', 'Ramesh Kumar', '2026-06-25 09:18:00+05:30'),
('s1010101-1010-1010-1010-101010101013', 'counter-1', 'e1111111-1111-1111-1111-111111111111', 'Suresh Singh', '2026-06-24 14:35:00+05:30');

-- Counter 2
INSERT INTO review_confirmations (qr_session_id, counter_id, employee_id, customer_name, confirmed_at) VALUES
('s2020202-2020-2020-2020-202020202020', 'counter-2', 'e2222222-2222-2222-2222-222222222222', 'Vikram Rathore', '2026-06-25 09:33:00+05:30');
