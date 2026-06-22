# 02 — Persiapan Server

Lakukan langkah-langkah ini **sekali saja** saat pertama kali menyiapkan server.

---

## 1. Update Sistem Operasi

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 2. Install Docker Engine

```bash
# Download dan jalankan script install resmi Docker
curl -fsSL https://get.docker.com | sh

# Tambahkan user ke group docker (agar tidak perlu sudo setiap saat)
sudo usermod -aG docker $USER

# Logout dan login ulang agar perubahan group aktif
logout
```

Setelah login ulang, verifikasi:
```bash
docker version
# Harus muncul: Client dan Server version
```

---

## 3. Verifikasi Docker Compose

Docker Compose versi 2 sudah termasuk dalam instalasi Docker modern sebagai plugin.

```bash
docker compose version
# Harus muncul: Docker Compose version v2.x.x
```

> Jika muncul error, install manual:
> ```bash
> sudo apt install docker-compose-plugin -y
> ```

---

## 4. Setup Firewall

```bash
# Install ufw jika belum ada
sudo apt install ufw -y

# Izinkan SSH (WAJIB — jangan sampai terkunci!)
sudo ufw allow 22/tcp

# Izinkan HTTP untuk akses aplikasi
sudo ufw allow 80/tcp

# Aktifkan firewall
sudo ufw enable

# Cek status
sudo ufw status
```

Output yang diharapkan:
```
Status: active
To                  Action      From
--                  ------      ----
22/tcp              ALLOW       Anywhere
80/tcp              ALLOW       Anywhere
```

---

## 5. Buat Direktori Aplikasi

```bash
# Buat folder untuk aplikasi
mkdir -p ~/apps
cd ~/apps
```

---

## 6. Copy File Aplikasi ke Server

Dari **komputer lokal** (Windows PowerShell):

```powershell
# Ganti user@192.168.1.xxx dengan user dan IP server yang sebenarnya
scp -r "d:\Local\PRODUCT INTERNAL APPS\product-tracker" user@192.168.1.xxx:~/apps/
```

Atau gunakan tools grafis seperti **WinSCP** atau **FileZilla**:
- Host: IP server
- Port: 22
- Protocol: SFTP
- Copy seluruh folder `product-tracker/` ke `~/apps/` di server

---

## 7. Verifikasi File di Server

```bash
cd ~/apps/product-tracker
ls -la
```

Pastikan file-file ini ada:
```
docker-compose.yml
deploy.sh
.env.example
backend-java/
frontend/
backend/db/schema.sql
backend/db/seed.sql
```

---

## Selesai

Server sudah siap. Lanjut ke **[03-configuration.md](03-configuration.md)** untuk konfigurasi.
