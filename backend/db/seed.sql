-- Product Tracker - Seed Data
-- All demo user passwords: "password"
-- Hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- ─── ROLES ──────────────────────────────────────────────────────────────────

INSERT INTO roles (name, display_name, permissions) VALUES
('super_admin', 'Super Admin',  '{"all": true}'),
('manager',     'Manager',      '{"read_all": true, "manage_users": true, "view_reports": true}'),
('po',          'Product Owner','{"manage_backlog": true, "manage_sprints": true, "manage_features": true}'),
('developer',   'Developer',    '{"view_all": true, "update_assigned": true}'),
('qa',          'QA Engineer',  '{"view_all": true, "manage_qa": true, "report_bugs": true}');

-- ─── USERS (password: admin123 / password123) ────────────────────────────────
-- bcrypt hash of "admin123"
INSERT INTO users (name, email, password_hash, role_id, avatar_color) VALUES
('Admin Sistem',  'admin@company.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '#4F46E5'),
('Budi Santoso',  'budi@company.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, '#0EA5E9'),
('Citra Dewi',    'citra@company.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, '#10B981'),
('Andi Pratama',  'andi@company.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, '#F59E0B'),
('Dewi Rahayu',   'dewi@company.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, '#EF4444'),
('Rafi Hidayat',  'rafi@company.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, '#8B5CF6'),
('Sari Indah',    'sari@company.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, '#EC4899');

-- ─── PRODUCTS ───────────────────────────────────────────────────────────────

INSERT INTO products (code, name, description, status, owner_id, color) VALUES
('INT-APP',   'Internal App System',   'Sistem aplikasi internal — onboarding, katalog, pembayaran', 'active', 3, '#4F46E5'),
('TREASURY',  'Treasury System',       'Sistem manajemen kas dan treasury perusahaan',               'active', 2, '#0EA5E9'),
('SMARTIN',   'Smartin',               'Platform smart inventory dan supply chain management',        'active', 3, '#10B981');

-- ─── EPICS — Internal App ────────────────────────────────────────────────────

INSERT INTO epics (product_id, code, name, status, priority, created_by) VALUES
(1, 'EP-01', 'Onboarding & Akun',          'in_progress', 'critical', 3),
(1, 'EP-02', 'Katalog & Pembayaran',        'in_progress', 'critical', 3),
(1, 'EP-03', 'Dashboard & Notifikasi',      'in_progress', 'high',     3),
(1, 'EP-04', 'Pelaporan & Analitik',        'open',        'low',      3);

INSERT INTO epics (product_id, code, name, status, priority, created_by) VALUES
(2, 'EP-01', 'Cash Management',             'in_progress', 'critical', 2),
(2, 'EP-02', 'Reporting & Compliance',      'open',        'high',     2);

INSERT INTO epics (product_id, code, name, status, priority, created_by) VALUES
(3, 'EP-01', 'Inventory Management',        'in_progress', 'critical', 3),
(3, 'EP-02', 'Supplier Integration',        'open',        'high',     3);

-- ─── FEATURES — Internal App ─────────────────────────────────────────────────

INSERT INTO features (product_id, epic_id, code, name, owner_id, status, priority, target_release) VALUES
(1, 1, 'FT-01', 'Autentikasi',     4, 'released',       'critical', 'v1.0'),
(1, 3, 'FT-02', 'Dashboard',       3, 'in_development', 'high',     'v1.1'),
(1, 2, 'FT-03', 'Katalog Produk',  5, 'in_development', 'medium',   'v1.1'),
(1, 2, 'FT-04', 'Pembayaran',      2, 'not_started',    'critical', 'v1.2'),
(1, 3, 'FT-05', 'Notifikasi',      3, 'on_hold',        'medium',   'v1.2'),
(1, 1, 'FT-06', 'Akun Pengguna',   5, 'not_started',    'low',      'v1.3'),
(1, 4, 'FT-07', 'Pelaporan',       NULL, 'not_started', 'low',      'v2.0');

-- ─── FEATURES — Treasury ─────────────────────────────────────────────────────

INSERT INTO features (product_id, epic_id, code, name, owner_id, status, priority, target_release) VALUES
(2, 5, 'FT-01', 'Cash Flow Tracking', 4, 'in_development', 'critical', 'v1.0'),
(2, 5, 'FT-02', 'Bank Reconciliation', 5, 'not_started',   'high',     'v1.1'),
(2, 6, 'FT-03', 'Financial Reports',   2, 'not_started',   'high',     'v1.2');

-- ─── FEATURES — Smartin ──────────────────────────────────────────────────────

INSERT INTO features (product_id, epic_id, code, name, owner_id, status, priority, target_release) VALUES
(3, 7, 'FT-01', 'Stock Management',   4, 'in_development', 'critical', 'v1.0'),
(3, 7, 'FT-02', 'Barcode Scanner',    5, 'not_started',    'medium',   'v1.1'),
(3, 8, 'FT-03', 'Supplier Portal',    2, 'not_started',    'high',     'v1.2');

-- ─── SPRINTS — Internal App ──────────────────────────────────────────────────

INSERT INTO sprints (product_id, name, goal, start_date, end_date, capacity, committed_points, completed_points, status) VALUES
(1, 'Sprint 1', 'Fondasi autentikasi pengguna',    '2026-01-07', '2026-01-18', 20, 8,  8,  'completed'),
(1, 'Sprint 2', 'Dashboard & katalog produk',       '2026-01-21', '2026-02-01', 22, 23, 0,  'active'),
(1, 'Sprint 3', 'Pembayaran & notifikasi',          '2026-02-04', '2026-02-15', 22, 18, 0,  'planned'),
(1, 'Sprint 4', '',                                 '2026-02-18', '2026-03-01', 22, 0,  0,  'planned'),
(1, 'Sprint 5', '',                                 '2026-03-04', '2026-03-15', 22, 0,  0,  'planned'),
(1, 'Sprint 6', '',                                 '2026-03-18', '2026-03-29', 22, 0,  0,  'planned');

INSERT INTO sprints (product_id, name, goal, start_date, end_date, capacity, committed_points, completed_points, status) VALUES
(2, 'Sprint 1', 'Cash flow module foundation',    '2026-01-07', '2026-01-18', 20, 15, 15, 'completed'),
(2, 'Sprint 2', 'Bank reconciliation MVP',        '2026-01-21', '2026-02-01', 22, 18, 5,  'active');

INSERT INTO sprints (product_id, name, goal, start_date, end_date, capacity, committed_points, completed_points, status) VALUES
(3, 'Sprint 1', 'Stock management core',          '2026-01-14', '2026-01-25', 20, 12, 12, 'completed'),
(3, 'Sprint 2', 'Barcode integration',            '2026-01-28', '2026-02-08', 22, 20, 8,  'active');

-- ─── BACKLOG ITEMS — Internal App ────────────────────────────────────────────
-- Sprint IDs: Sprint1=1, Sprint2=2, Sprint3=3
-- Feature IDs: FT-01(auth)=1, FT-02(dashboard)=2, FT-03(katalog)=3, FT-04(payment)=4, FT-05(notif)=5, FT-06(akun)=6, FT-07(laporan)=7
-- Epic IDs: EP-01=1, EP-02=2, EP-03=3, EP-04=4
-- User IDs: admin=1, budi=2, citra=3, andi=4, dewi=5

INSERT INTO backlog_items (product_id, code, title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, deadline, created_by, created_at) VALUES
(1, 'PB-001', 'Sebagai user saya bisa registrasi dengan email', 'story', 1, 1, 'critical', 5, 'done',        1, 4,
  E'• Email tervalidasi format\n• Verifikasi email terkirim\n• Akun aktif setelah verifikasi',
  '2026-01-18', 3, '2026-01-06'),
(1, 'PB-002', 'Sebagai user saya bisa login & logout',          'story', 1, 1, 'critical', 3, 'done',        1, 4,
  E'• Login kredensial benar berhasil\n• Pesan error jika salah\n• Sesi berakhir saat logout',
  '2026-01-18', 3, '2026-01-06'),
(1, 'PB-003', 'Reset password via email',                       'story', 1, 1, 'high',     5, 'in_review',   2, 2,
  E'• Link reset valid 1 jam\n• Password baru tersimpan ter-hash',
  '2026-02-01', 3, '2026-01-13'),
(1, 'PB-004', 'Dashboard ringkasan untuk user',                 'story', 2, 3, 'high',     8, 'in_progress', 2, 3,
  E'• Menampilkan ringkasan KPI utama\n• Data refresh < 3 detik',
  '2026-02-01', 3, '2026-01-13'),
(1, 'PB-005', 'Filter & pencarian pada daftar produk',          'story', 3, 2, 'medium',   5, 'in_progress', 2, 5,
  E'• Filter by kategori & harga\n• Pencarian by nama produk',
  '2026-02-01', 3, '2026-01-16'),
(1, 'PB-006', 'Bug: gambar produk tidak tampil di mobile',      'bug',   3, 2, 'high',     2, 'todo',        3, 5,
  E'• Gambar tampil benar di iOS & Android\n• Fallback bila gambar gagal load',
  '2026-02-15', 3, '2026-01-21'),
(1, 'PB-007', 'Integrasi payment gateway',                      'story', 4, 2, 'critical', 13,'todo',        3, 2,
  E'• Pembayaran berhasil tercatat\n• Handle gagal/timeout\n• Resi/struk dikirim',
  '2026-02-15', 3, '2026-01-21'),
(1, 'PB-008', 'Riwayat transaksi pengguna',                     'story', 4, 2, 'medium',   5, 'backlog',     NULL, NULL,
  E'• Daftar transaksi tampil terurut\n• Detail per transaksi dapat dibuka',
  NULL, 3, '2026-01-23'),
(1, 'PB-009', 'Notifikasi email untuk order',                   'task',  5, 3, 'medium',   3, 'blocked',     3, 3,
  E'• Email terkirim saat order dibuat\n• Template email sesuai brand',
  '2026-02-15', 3, '2026-01-23'),
(1, 'PB-010', 'Halaman profil & edit data',                     'story', 6, 1, 'low',      5, 'backlog',     NULL, NULL,
  E'• Data profil dapat diedit & tersimpan\n• Validasi field wajib',
  NULL, 3, '2026-01-26'),
(1, 'PB-011', 'Epic: Modul laporan & analitik',                 'epic',  7, 4, 'low',      20,'backlog',     NULL, NULL,
  E'• Definisikan sub-story laporan\n• Cakupan modul disepakati',
  NULL, 3, '2026-01-29'),
(1, 'PB-012', 'Dukungan multi-bahasa (i18n)',                   'story', 6, 1, 'low',      8, 'backlog',     NULL, NULL,
  E'• Minimal ID & EN didukung\n• Teks UI ter-translate',
  NULL, 3, '2026-01-29'),
(1, 'PB-013', 'Halaman login sesuai desain mockup',             'story', 1, 1, 'high',     5, 'todo',        2, 4,
  E'• Layout sesuai mockup\n• Warna & font sesuai brand\n• Responsive di mobile',
  '2026-02-01', 3, '2026-02-03');

-- ─── BACKLOG ITEMS — Treasury ─────────────────────────────────────────────────

INSERT INTO backlog_items (product_id, code, title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, deadline, created_by, created_at) VALUES
(2, 'TRS-001', 'Input daily cash position',        'story', 8,  5, 'critical', 8,  'done',        7, 4, E'• Manual input form\n• Auto-save every 30s', '2026-01-18', 2, '2026-01-06'),
(2, 'TRS-002', 'Cash flow report PDF export',      'story', 8,  5, 'high',     5,  'done',        7, 2, E'• Export to PDF\n• Include date range filter', '2026-01-18', 2, '2026-01-06'),
(2, 'TRS-003', 'Bank statement import (CSV)',       'story', 9,  5, 'high',     8,  'in_progress', 8, 4, E'• Parse CSV format\n• Map to transactions', '2026-02-01', 2, '2026-01-20'),
(2, 'TRS-004', 'Auto-reconciliation matching',     'story', 9,  5, 'critical', 13, 'todo',        8, 5, E'• Match by amount & date\n• Flag unmatched items', '2026-02-01', 2, '2026-01-20'),
(2, 'TRS-005', 'Monthly financial summary report', 'story', 10, 6, 'medium',   8,  'backlog',     NULL, NULL, E'• P&L summary\n• Balance sheet', NULL, 2, '2026-01-25');

-- ─── BACKLOG ITEMS — Smartin ──────────────────────────────────────────────────

INSERT INTO backlog_items (product_id, code, title, type, feature_id, epic_id, priority, story_points, status, sprint_id, assignee_id, acceptance_criteria, deadline, created_by, created_at) VALUES
(3, 'SMT-001', 'Add/edit product stock',           'story', 11, 7, 'critical', 5,  'done',        9,  4, E'• CRUD for stock items\n• Audit log', '2026-01-25', 3, '2026-01-13'),
(3, 'SMT-002', 'Low stock alert notification',     'story', 11, 7, 'high',     3,  'done',        9,  5, E'• Trigger alert at threshold\n• Email + in-app', '2026-01-25', 3, '2026-01-13'),
(3, 'SMT-003', 'Stock movement history',           'story', 11, 7, 'medium',   5,  'in_progress', 10, 4, E'• Timeline view\n• Filter by date & SKU', '2026-02-08', 3, '2026-01-27'),
(3, 'SMT-004', 'Barcode scan to update stock',     'story', 12, 7, 'high',     8,  'in_progress', 10, 5, E'• Web camera scan\n• Manual entry fallback', '2026-02-08', 3, '2026-01-27'),
(3, 'SMT-005', 'Supplier purchase order',          'story', 13, 8, 'high',     13, 'todo',        10, 2, E'• Create PO\n• Send to supplier email', '2026-02-08', 3, '2026-01-27'),
(3, 'SMT-006', 'Supplier portal login',            'story', 13, 8, 'medium',   5,  'backlog',     NULL, NULL, E'• Separate login for suppliers\n• View PO status', NULL, 3, '2026-02-01');

-- ─── BURNDOWN DATA — Sprint 1 (Internal App) ─────────────────────────────────

INSERT INTO burndown_data (sprint_id, day, ideal_remaining, actual_remaining) VALUES
(1, 0,  8.0, 8.0),
(1, 1,  7.2, 8.0),
(1, 2,  6.4, 7.0),
(1, 3,  5.6, 6.0),
(1, 4,  4.8, 6.0),
(1, 5,  4.0, 5.0),
(1, 6,  3.2, 4.0),
(1, 7,  2.4, 3.0),
(1, 8,  1.6, 2.0),
(1, 9,  0.8, 1.0),
(1, 10, 0.0, 0.0);

INSERT INTO burndown_data (sprint_id, day, ideal_remaining, actual_remaining) VALUES
(7, 0,  15.0, 15.0),
(7, 1,  13.5, 15.0),
(7, 2,  12.0, 13.0),
(7, 3,  10.5, 12.0),
(7, 4,   9.0, 10.0),
(7, 5,   7.5,  8.0),
(7, 6,   6.0,  6.0),
(7, 7,   4.5,  4.0),
(7, 8,   3.0,  2.0),
(7, 9,   1.5,  1.0),
(7, 10,  0.0,  0.0);

INSERT INTO burndown_data (sprint_id, day, ideal_remaining, actual_remaining) VALUES
(9, 0,  12.0, 12.0),
(9, 1,  10.9, 12.0),
(9, 2,   9.8, 10.0),
(9, 3,   8.7,  9.0),
(9, 4,   7.6,  8.0),
(9, 5,   6.5,  6.0),
(9, 6,   5.5,  4.0),
(9, 7,   4.4,  3.0),
(9, 8,   3.3,  1.0),
(9, 9,   2.2,  0.0),
(9, 10,  0.0,  0.0);

-- ─── QA TEST CASES ───────────────────────────────────────────────────────────

INSERT INTO qa_test_cases (backlog_item_id, product_id, code, title, description, steps, expected_result, status, priority, created_by) VALUES
(1, 1, 'TC-001', 'Registrasi dengan email valid',
  'Verifikasi alur registrasi email berhasil',
  E'1. Buka halaman registrasi\n2. Isi email valid\n3. Isi password (min 8 char)\n4. Klik Register\n5. Cek inbox email',
  'Akun terbuat, email verifikasi terkirim', 'active', 'critical', 6),
(1, 1, 'TC-002', 'Registrasi dengan email duplikat',
  'Verifikasi error saat email sudah terdaftar',
  E'1. Daftarkan email yang sudah ada\n2. Klik Register',
  'Muncul pesan error "Email sudah terdaftar"', 'active', 'high', 6),
(2, 1, 'TC-003', 'Login dengan kredensial benar',
  'Verifikasi login berhasil',
  E'1. Buka halaman login\n2. Masukkan email & password benar\n3. Klik Login',
  'Redirect ke dashboard, sesi aktif', 'active', 'critical', 6),
(2, 1, 'TC-004', 'Login dengan password salah',
  'Verifikasi error pada kredensial salah',
  E'1. Masukkan password salah\n2. Klik Login',
  'Pesan error "Email atau password salah"', 'active', 'high', 6),
(3, 1, 'TC-005', 'Reset password via email',
  'Verifikasi link reset password',
  E'1. Klik "Lupa Password"\n2. Masukkan email\n3. Cek inbox\n4. Klik link reset\n5. Set password baru',
  'Password berhasil direset, bisa login', 'active', 'high', 6);

-- ─── QA TEST RUNS ────────────────────────────────────────────────────────────

INSERT INTO qa_test_runs (test_case_id, sprint_id, tester_id, result, notes, executed_at) VALUES
(1, 1, 6, 'pass',    'Semua skenario lulus',                        '2026-01-15 10:30:00'),
(2, 1, 6, 'pass',    'Error message sesuai ekspektasi',             '2026-01-15 10:45:00'),
(3, 1, 6, 'pass',    'Login sukses, token valid',                   '2026-01-15 11:00:00'),
(4, 1, 6, 'pass',    'Error handling benar',                        '2026-01-15 11:15:00'),
(5, 2, 6, 'fail',    'Link expired terlalu cepat (bug ditemukan)',   '2026-01-22 09:00:00'),
(5, 2, 7, 'pending', NULL,                                          NULL);

-- ─── USER PRODUCTS ────────────────────────────────────────────────────────────
-- super_admin & manager: akses semua produk
-- role lain: akses sesuai assignment

INSERT INTO user_products (user_id, product_id) VALUES
(1, 1),(1, 2),(1, 3),   -- Admin Sistem (super_admin): semua produk
(2, 1),(2, 2),(2, 3),   -- Budi Santoso (manager): semua produk
(3, 1),(3, 3),          -- Citra Dewi (po): INT-APP, SMARTIN
(4, 1),(4, 2),(4, 3),   -- Andi Pratama (developer): semua produk
(5, 1),(5, 2),          -- Dewi Rahayu (developer): INT-APP, TREASURY
(6, 1),                 -- Rafi Hidayat (qa): INT-APP
(7, 1),(7, 3);          -- Sari Indah (qa): INT-APP, SMARTIN
