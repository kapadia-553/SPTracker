-- Demo data for SP Track
-- Run this after initial migration

-- Insert demo tenant
INSERT INTO "Tenants" ("Id", "Name", "Slug", "Timezone", "BusinessHoursJson", "Active", "CreatedAt", "UpdatedAt")
VALUES (
    '12345678-1234-1234-1234-123456789012',
    'Demo Organization',
    'demo',
    'Asia/Dubai',
    '{"Sunday":{"Start":"09:00","End":"18:00"},"Monday":{"Start":"09:00","End":"18:00"},"Tuesday":{"Start":"09:00","End":"18:00"},"Wednesday":{"Start":"09:00","End":"18:00"},"Thursday":{"Start":"09:00","End":"18:00"},"Friday":null,"Saturday":null}',
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert demo project
INSERT INTO "Projects" ("Id", "TenantId", "Key", "Name", "Description", "Active", "CreatedAt", "UpdatedAt")
VALUES (
    '12345678-1234-1234-1234-123456789013',
    '12345678-1234-1234-1234-123456789012',
    'DEMO',
    'Demo Project',
    'Demo project for testing SP Track',
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert demo category
INSERT INTO "Categories" ("Id", "TenantId", "Name", "CreatedAt")
VALUES (
    '12345678-1234-1234-1234-123456789014',
    '12345678-1234-1234-1234-123456789012',
    'General Support',
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert demo product
INSERT INTO "Products" ("Id", "TenantId", "Code", "Name", "CreatedAt")
VALUES (
    '12345678-1234-1234-1234-123456789015',
    '12345678-1234-1234-1234-123456789012',
    'MAIN',
    'Main Product',
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert SLA policies
INSERT INTO "SlaPolicies" ("Id", "TenantId", "Name", "AppliesToJson", "FirstResponseMins", "ResolveMins", "PauseOnWaitingCustomer", "Active", "CreatedAt")
VALUES 
    ('12345678-1234-1234-1234-123456789016', '12345678-1234-1234-1234-123456789012', 'P1 Critical SLA', '{"Priority":["P1"]}', 60, 480, true, true, NOW()),
    ('12345678-1234-1234-1234-123456789017', '12345678-1234-1234-1234-123456789012', 'P2 High SLA', '{"Priority":["P2"]}', 240, 2880, true, true, NOW()),
    ('12345678-1234-1234-1234-123456789018', '12345678-1234-1234-1234-123456789012', 'P3 Normal SLA', '{"Priority":["P3"]}', 480, 7200, true, true, NOW()),
    ('12345678-1234-1234-1234-123456789019', '12345678-1234-1234-1234-123456789012', 'P4 Low SLA', '{"Priority":["P4"]}', 960, 14400, true, true, NOW())
ON CONFLICT DO NOTHING;