# 03 — Konfigurasi

Semua konfigurasi server diatur melalui file `.env` di root folder project.

---

## Membuat File .env

```bash
cd ~/apps/product-tracker
cp .env.example .env
nano .env
```

---

## Isi File .env

```bash
# IP atau domain server
CORS_ORIGIN=http://192.168.1.100

# Password database PostgreSQL
DB_PASSWORD=P@ssw0rd_Database_Kuat

# JWT Secret untuk otentikasi
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901
```

---

## Penjelasan Setiap Variabel

### `CORS_ORIGIN`

URL yang diizinkan untuk mengakses API backend.  
Isi dengan IP atau domain yang digunakan user untuk membuka aplikasi.

```bash
# Contoh — pakai IP server
CORS_ORIGIN=http://192.168.1.100

# Contoh — pakai domain internal
CORS_ORIGIN=http://tracker.internal.perusahaan.com

# Contoh — pakai domain + HTTPS
CORS_ORIGIN=https://tracker.perusahaan.com
```

> Cara cek IP server: jalankan `hostname -I` di server, ambil IP pertama.

---

### `DB_PASSWORD`

Password untuk database PostgreSQL. Gunakan password yang kuat.

**Syarat password yang baik:**
- Minimal 16 karakter
- Kombinasi huruf besar, huruf kecil, angka, dan simbol
- Jangan pakai kata yang ada di kamus

```bash
# Contoh password kuat
DB_PASSWORD=Tr@cker!DB#2024$Secure

# Atau generate otomatis
DB_PASSWORD=$(openssl rand -base64 24)
echo $DB_PASSWORD   # catat hasilnya!
```

> **PENTING:** Catat password ini di tempat yang aman.  
> Jika hilang, database harus di-reset ulang (data hilang).

---

### `JWT_SECRET`

Kunci rahasia untuk menandatangani token login (JWT).  
Harus berupa string panjang dan acak.

**Cara generate:**
```bash
openssl rand -hex 32
# Contoh output: a3f8c2e1d4b7a9f0e2c5d8b1a4f7c0e3d6b9a2f5c8e1d4b7a0f3c6e9d2b5a8f1
```

Salin output tersebut ke variabel `JWT_SECRET`:
```bash
JWT_SECRET=a3f8c2e1d4b7a9f0e2c5d8b1a4f7c0e3d6b9a2f5c8e1d4b7a0f3c6e9d2b5a8f1
```

> **PENTING:** Jika JWT_SECRET diubah, **semua user akan ter-logout** dan harus login ulang.

---

## Contoh File .env Lengkap

```bash
# Product Tracker — Konfigurasi Production
# File ini RAHASIA — jangan di-commit ke Git

CORS_ORIGIN=http://192.168.1.100
DB_PASSWORD=Tr@cker!DB#2024$Secure
JWT_SECRET=a3f8c2e1d4b7a9f0e2c5d8b1a4f7c0e3d6b9a2f5c8e1d4b7a0f3c6e9d2b5a8f1
```

---

## Referensi Lengkap docker-compose.yml

Tabel ini menjelaskan semua variabel environment yang dipakai Docker Compose:

### Service: `db` (PostgreSQL)

| Variabel | Nilai | Keterangan |
|----------|-------|------------|
| `POSTGRES_DB` | `product_tracker` | Nama database (tetap) |
| `POSTGRES_USER` | `pt_user` | Username DB (tetap) |
| `POSTGRES_PASSWORD` | dari `${DB_PASSWORD}` | Password DB |

### Service: `backend` (Spring Boot)

| Variabel | Nilai | Keterangan |
|----------|-------|------------|
| `SERVER_PORT` | `4000` | Port backend (tetap) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/product_tracker` | Koneksi DB internal (tetap) |
| `SPRING_DATASOURCE_USERNAME` | `pt_user` | Username DB (tetap) |
| `SPRING_DATASOURCE_PASSWORD` | dari `${DB_PASSWORD}` | Password DB |
| `APP_JWT_SECRET` | dari `${JWT_SECRET}` | Secret JWT |
| `APP_JWT_EXPIRATION` | `604800000` | Masa aktif token = 7 hari (ms) |
| `APP_CORS_ORIGIN` | dari `${CORS_ORIGIN}` | Origin yang diizinkan |

### Service: `frontend` (Nginx + React)

| Variabel | Nilai | Keterangan |
|----------|-------|------------|
| `VITE_API_URL` | `/api` | Path API (Nginx proxy, tetap) |

---

## Konfigurasi Nginx

File: `frontend/nginx.conf` — tidak perlu diubah untuk setup standar.

```nginx
location /api/ {
    proxy_pass http://backend:4000/api/;
}
```

Nginx secara otomatis meneruskan semua request `/api/...` dari browser ke backend container.  
Karena itu, port 4000 tidak perlu dibuka ke publik.

---

## Selesai

Lanjut ke **[04-deploy-steps.md](04-deploy-steps.md)** untuk menjalankan deployment.
