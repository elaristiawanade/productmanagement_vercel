# 07 — Troubleshooting

---

## Cara Diagnosa Cepat

Selalu mulai dengan dua perintah ini:

```bash
cd ~/apps/product-tracker

# 1. Cek status semua container
docker compose ps

# 2. Cek log container yang bermasalah
docker compose logs --tail=50 backend
docker compose logs --tail=50 db
docker compose logs --tail=50 frontend
```

---

## Masalah 1 — Halaman Tidak Bisa Dibuka

**Gejala:** Browser menampilkan "Connection refused" atau tidak bisa akses `http://IP_SERVER`

**Penyebab & Solusi:**

```bash
# Cek apakah container frontend berjalan
docker compose ps frontend

# Cek apakah port 80 sudah dipakai aplikasi lain
sudo ss -tlnp | grep :80
```

Jika port 80 sudah dipakai:
```bash
# Lihat proses yang memakai port 80
sudo lsof -i :80

# Hentikan proses tersebut (misal nginx sistem)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Deploy ulang
docker compose up -d
```

---

## Masalah 2 — Container Backend Terus Restart

**Gejala:** `docker compose ps` menampilkan `Restarting` untuk service `backend`

**Penyebab paling umum:** Database belum siap ketika backend start.

```bash
# Lihat log detail
docker compose logs --tail=50 backend
```

Jika log menampilkan `Connection refused` atau `FATAL: database does not exist`:
```bash
# Stop semua, lalu start ulang dengan urutan yang benar
docker compose down
docker compose up -d db
sleep 15
docker compose up -d backend frontend
```

Jika log menampilkan `Could not resolve placeholder`:
```bash
# Cek apakah semua variabel .env sudah diisi
cat .env
docker compose config   # preview konfigurasi yang akan dipakai
```

---

## Masalah 3 — Database Tidak Mau Start

**Gejala:** Container `pt_postgres` berstatus `Exit` atau `unhealthy`

```bash
docker compose logs --tail=30 db
```

**Kasus A — Volume corrupt:**
```bash
# Reset total database (DATA HILANG)
docker compose down -v
docker compose up -d
```

**Kasus B — Port 5432 sudah dipakai:**
```bash
sudo ss -tlnp | grep :5432
# Jika ada PostgreSQL sistem yang berjalan:
sudo systemctl stop postgresql
sudo systemctl disable postgresql
docker compose up -d
```

---

## Masalah 4 — Login Gagal (401 Unauthorized)

**Gejala:** Login di browser gagal meskipun email/password benar

**Kemungkinan penyebab:**

```bash
# Cek log backend saat login
docker compose logs --tail=20 backend | grep -i "auth\|jwt\|login"
```

**Jika JWT_SECRET berubah setelah ada data:**

Token lama tidak valid. User harus login ulang. Bukan bug — ini normal.

**Jika password database salah:**
```bash
# Cek apakah .env DB_PASSWORD cocok dengan yang dipakai saat pertama deploy
# Jika berbeda, lakukan reset total:
docker compose down -v
docker compose up -d
```

---

## Masalah 5 — Frontend Bisa Dibuka Tapi API Error (500 / CORS)

**Gejala:** Halaman muncul tapi data tidak tampil, ada error di browser console

```bash
# Buka developer tools browser (F12) → tab Network
# Lihat request yang gagal
```

**Jika error CORS (blocked by CORS policy):**
```bash
# Cek nilai CORS_ORIGIN di .env
cat .env | grep CORS_ORIGIN
# Harus sama persis dengan URL yang dipakai di browser
# Contoh: jika akses via http://192.168.1.100 maka CORS_ORIGIN=http://192.168.1.100

# Setelah edit .env, restart backend
docker compose restart backend
```

**Jika error 500 Internal Server Error:**
```bash
# Lihat log backend untuk error detail
docker compose logs --tail=50 backend | grep -A5 "ERROR\|Exception"
```

---

## Masalah 6 — Build Docker Gagal

**Gejala:** `bash deploy.sh` gagal saat proses build

**Kasus A — Tidak ada koneksi internet:**
```bash
ping google.com
# Jika tidak ada respons, cek koneksi server
```

**Kasus B — Maven download gagal (timeout):**
```bash
# Coba build ulang
docker compose build --no-cache backend
```

**Kasus C — Tidak cukup storage:**
```bash
df -h
# Jika storage penuh, bersihkan dulu
docker system prune -f
docker compose build
```

---

## Masalah 7 — Aplikasi Lambat / Tidak Responsif

**Gejala:** Halaman lama loading, request timeout

```bash
# Cek penggunaan resource
docker stats --no-stream
```

Jika RAM hampir penuh:
```bash
# Restart backend untuk bebaskan memori
docker compose restart backend

# Jika masih lambat, pertimbangkan upgrade RAM server
```

---

## Masalah 8 — Server Reboot, Aplikasi Tidak Otomatis Menyala

```bash
cd ~/apps/product-tracker
docker compose up -d
```

Pastikan Docker service aktif saat boot:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## Perintah Darurat

```bash
# Paksa hentikan semua container
docker compose kill

# Hapus container (data tetap aman di volume)
docker compose down

# Hapus semua termasuk data (HATI-HATI!)
docker compose down -v

# Start ulang dari awal
bash deploy.sh
```

---

## Masih Bermasalah?

Kumpulkan informasi berikut untuk troubleshooting lebih lanjut:

```bash
# Simpan semua log ke file
docker compose logs > ~/debug_log_$(date +%Y%m%d_%H%M%S).txt

# Info sistem
echo "=== Docker version ===" >> ~/debug_info.txt
docker version >> ~/debug_info.txt
echo "=== Compose ps ===" >> ~/debug_info.txt
docker compose ps >> ~/debug_info.txt
echo "=== Disk usage ===" >> ~/debug_info.txt
df -h >> ~/debug_info.txt
echo "=== Memory ===" >> ~/debug_info.txt
free -h >> ~/debug_info.txt

cat ~/debug_info.txt
```
