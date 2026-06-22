# 04 — Langkah Deploy

Pastikan sudah menyelesaikan [02-server-setup.md](02-server-setup.md) dan [03-configuration.md](03-configuration.md) sebelum melanjutkan.

---

## Deploy Pertama Kali (Fresh Install)

### Langkah 1 — Masuk ke folder project

```bash
cd ~/apps/product-tracker
```

### Langkah 2 — Jalankan script deploy

```bash
bash deploy.sh
```

Script ini akan:
1. Mengecek apakah Docker dan Docker Compose tersedia
2. Mengecek apakah file `.env` sudah dikonfigurasi
3. Membangun Docker image untuk backend (kompilasi Java) dan frontend (build React)
4. Menjalankan semua container
5. Menampilkan URL akses

> **Durasi build pertama:** sekitar 3–7 menit (download dependencies Maven + npm)  
> Build selanjutnya jauh lebih cepat karena cache.

### Langkah 3 — Tunggu hingga selesai

Output yang diharapkan di akhir:
```
==============================
 Deploy berhasil!
 Akses: http://192.168.1.100
==============================

Login default:
  Email    : admin@company.com
  Password : password
```

---

## Cek Status Container

```bash
docker compose ps
```

Output yang diharapkan (semua `running`):
```
NAME           IMAGE                STATUS          PORTS
pt_postgres    postgres:15-alpine   Up (healthy)    5432/tcp
pt_backend     ...                  Up              4000/tcp
pt_frontend    ...                  Up              0.0.0.0:80->80/tcp
```

> Jika ada yang `Exit` atau `Restarting`, lihat [07-troubleshooting.md](07-troubleshooting.md).

---

## Melihat Log

```bash
# Log semua service sekaligus
docker compose logs -f

# Log hanya backend
docker compose logs -f backend

# Log hanya database
docker compose logs -f db

# Log hanya frontend
docker compose logs -f frontend

# Tampilkan 100 baris terakhir saja
docker compose logs --tail=100 backend
```

Tekan `Ctrl+C` untuk keluar dari mode log live.

---

## Urutan Start yang Benar

Docker Compose secara otomatis mengatur urutan:

```
db (PostgreSQL) → mulai + healthcheck
        ↓
backend (Spring Boot) → mulai setelah DB siap
        ↓
frontend (Nginx) → mulai setelah backend siap
```

Spring Boot biasanya membutuhkan **10–15 detik** untuk siap sepenuhnya setelah container `Up`.

---

## Update Aplikasi (Deploy Ulang)

Jika ada perubahan kode dan ingin deploy ulang:

```bash
cd ~/apps/product-tracker

# Hapus file lama, copy file baru (dari komputer lokal dulu)
# Kemudian:
bash deploy.sh
```

Atau jika hanya ingin restart tanpa rebuild:

```bash
docker compose restart
```

Atau restart satu service saja:

```bash
docker compose restart backend
```

---

## Stop Aplikasi

```bash
# Hentikan semua container (data tidak hilang)
docker compose stop

# Jalankan ulang
docker compose start
```

---

## Hapus Semua (Reset Total)

> ⚠️ **PERINGATAN:** Perintah ini menghapus semua data database secara permanen.

```bash
# Hapus container dan volume (data DB hilang!)
docker compose down -v

# Deploy ulang dari awal
bash deploy.sh
```

---

## Ringkasan Perintah Penting

| Aksi | Perintah |
|------|----------|
| Deploy / update | `bash deploy.sh` |
| Cek status | `docker compose ps` |
| Lihat log | `docker compose logs -f` |
| Stop semua | `docker compose stop` |
| Start ulang | `docker compose start` |
| Restart service | `docker compose restart backend` |
| Reset total | `docker compose down -v` lalu `bash deploy.sh` |
