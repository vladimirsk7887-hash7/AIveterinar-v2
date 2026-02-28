// Minimal env for all tests — no real credentials needed
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex
process.env.SUPERADMIN_EMAIL = 'admin@test.com';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-must-be-32-chars!!';
process.env.NODE_ENV = 'test';
