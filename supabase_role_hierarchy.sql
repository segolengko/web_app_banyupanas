ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';

CREATE INDEX IF NOT EXISTS idx_users_profile_role_is_active
  ON users_profile (role, is_active);

-- Contoh penggunaan:
-- Jadikan satu akun sebagai super admin utama
-- UPDATE users_profile SET role = 'super_admin' WHERE email = 'email-kamu@domain.com';

-- Jadikan akun tertentu sebagai admin operasional
-- UPDATE users_profile SET role = 'admin' WHERE email = 'admin@domain.com';

-- Jadikan akun tertentu sebagai supervisor
-- UPDATE users_profile SET role = 'supervisor' WHERE email = 'supervisor@domain.com';

-- Pastikan akun petugas tetap bertipe petugas
-- UPDATE users_profile SET role = 'petugas' WHERE email = 'petugas@domain.com';
