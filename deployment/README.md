# Panduan Migrasi Production — Product Tracker

Folder ini berisi semua dokumen yang dibutuhkan untuk men-deploy aplikasi Product Tracker ke server production.

---

## Daftar Dokumen

| No | File | Isi |
|----|------|-----|
| 1 | [01-requirements.md](01-requirements.md) | Kebutuhan server (hardware, software, jaringan) |
| 2 | [02-server-setup.md](02-server-setup.md) | Cara install Docker & persiapan server |
| 3 | [03-configuration.md](03-configuration.md) | Panduan konfigurasi `.env` dan semua variabel |
| 4 | [04-deploy-steps.md](04-deploy-steps.md) | Langkah-langkah deploy dari awal sampai selesai |
| 5 | [05-verification.md](05-verification.md) | Checklist verifikasi setelah deploy |
| 6 | [06-maintenance.md](06-maintenance.md) | Backup, update, monitoring rutin |
| 7 | [07-troubleshooting.md](07-troubleshooting.md) | Solusi masalah yang umum terjadi |

---

## Ringkasan Cepat (untuk yang sudah berpengalaman)

```bash
# 1. Di server — install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && logout

# 2. Copy project ke server (dari komputer lokal)
scp -r "product-tracker/" user@SERVER_IP:/home/user/

# 3. Di server — konfigurasi
cd ~/product-tracker
cp .env.example .env
nano .env          # isi CORS_ORIGIN, JWT_SECRET, DB_PASSWORD

# 4. Deploy
bash deploy.sh

# 5. Akses aplikasi
# http://IP_SERVER
# Login: admin@company.com / password
```

---

## Arsitektur Aplikasi

```
Browser User
    │
    ▼
┌─────────────────┐
│   Nginx : 80    │  ← frontend React (port 80)
│                 │
│  /api/* ──────────────────────────────┐
└─────────────────┘                     │
                                        ▼
                            ┌─────────────────────┐
                            │  Spring Boot : 4000  │  ← backend Java
                            └─────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────┐
                            │  PostgreSQL : 5432   │  ← database (internal only)
                            └─────────────────────┘
```

Semua service berjalan dalam **Docker container** yang dikelola oleh **Docker Compose**.  
Database **tidak bisa diakses dari luar** — hanya dari backend container.

---

## Stack Teknologi

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Frontend | React + Vite + Tailwind CSS | React 18 |
| Web Server | Nginx (dalam container) | Alpine |
| Backend | Java Spring Boot | 3.3.6 / Java 21 |
| Database | PostgreSQL | 15 |
| Container | Docker + Docker Compose | — |

---

## Akun Default Setelah Deploy

| Nama | Email | Password | Role |
|------|-------|----------|------|
| Admin Sistem | admin@company.com | password | Super Admin |
| Budi Santoso | budi@company.com | password | Manager |
| Citra Dewi | citra@company.com | password | Product Owner |
| Andi Pratama | andi@company.com | password | Developer |
| Dewi Rahayu | dewi@company.com | password | Developer |
| Rafi Hidayat | rafi@company.com | password | QA Engineer |
| Sari Indah | sari@company.com | password | QA Engineer |

> **PENTING:** Ganti password semua akun setelah login pertama kali.
