# 06 — Maintenance & Operasional

---

## Monitoring Harian

### Cek status container

```bash
cd ~/apps/product-tracker
docker compose ps
```

### Cek penggunaan resource

```bash
docker stats --no-stream
```

Output contoh:
```
NAME          CPU %   MEM USAGE / LIMIT   MEM %
pt_frontend   0.0%    8MB / 1GB           0.8%
pt_backend    0.5%    380MB / 1GB         38%
pt_postgres   0.2%    210MB / 1GB         21%
```

### Cek log error

```bash
# Log backend (paling penting)
docker compose logs --tail=50 backend | grep -i "error\|exception\|warn"

# Log database
docker compose logs --tail=20 db
```

---

## Backup Database

### Backup Manual

```bash
# Buat folder backup jika belum ada
mkdir -p ~/backups

# Backup database ke file SQL
docker exec pt_postgres pg_dump \
  -U pt_user \
  -d product_tracker \
  --no-password \
  > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

echo "Backup selesai: ~/backups/"
ls -lh ~/backups/
```

### Backup Otomatis (Cron Job)

Setup backup otomatis setiap hari pukul 02:00:

```bash
# Edit crontab
crontab -e
```

Tambahkan baris berikut:
```
0 2 * * * cd ~/apps/product-tracker && docker exec pt_postgres pg_dump -U pt_user -d product_tracker > ~/backups/backup_$(date +\%Y\%m\%d).sql 2>/dev/null
```

### Hapus Backup Lama (Hemat Storage)

```bash
# Hapus backup lebih dari 30 hari
find ~/backups -name "backup_*.sql" -mtime +30 -delete
```

Tambahkan ke crontab (berjalan setiap minggu):
```
0 3 * * 0 find ~/backups -name "backup_*.sql" -mtime +30 -delete
```

---

## Restore Database

> ⚠️ Restore akan **menghapus semua data yang ada** dan menggantinya dengan isi backup.

```bash
# Pilih file backup yang ingin di-restore
BACKUP_FILE=~/backups/backup_20260612_020000.sql

# Hapus data lama dan restore
docker exec -i pt_postgres psql \
  -U pt_user \
  -d product_tracker \
  < $BACKUP_FILE

echo "Restore selesai"
```

---

## Update Aplikasi

Ketika ada versi baru aplikasi:

```bash
cd ~/apps/product-tracker

# 1. Backup database dulu (wajib sebelum update)
docker exec pt_postgres pg_dump -U pt_user -d product_tracker \
  > ~/backups/backup_before_update_$(date +%Y%m%d).sql

# 2. Copy file baru ke server (dari komputer lokal)
# Gunakan scp atau WinSCP untuk overwrite folder

# 3. Build ulang dan deploy
bash deploy.sh
```

---

## Restart Setelah Server Reboot

Container dikonfigurasi dengan `restart: unless-stopped`, sehingga **otomatis menyala** ketika server di-reboot.

Verifikasi pengaturan ini:
```bash
docker compose ps
# Semua container harus berjalan otomatis setelah reboot
```

Jika perlu start manual:
```bash
cd ~/apps/product-tracker
docker compose start
```

---

## Membersihkan Docker (Hemat Storage)

Jalankan secara berkala (misal setiap bulan) untuk membersihkan image dan container yang tidak terpakai:

```bash
# Hapus image yang tidak dipakai
docker image prune -f

# Hapus semua resource yang tidak dipakai (lebih agresif)
docker system prune -f

# Cek sisa storage
df -h
```

---

## Mengganti Konfigurasi (JWT Secret, Password DB, dll)

Jika perlu mengganti nilai di `.env`:

```bash
cd ~/apps/product-tracker
nano .env
# Edit nilai yang perlu diubah
```

Kemudian restart container agar konfigurasi baru berlaku:

```bash
docker compose down
docker compose up -d
```

> Jika `JWT_SECRET` diubah → semua user akan ter-logout otomatis.  
> Jika `DB_PASSWORD` diubah → database perlu di-reset (data bisa hilang), tidak disarankan.

---

## Ringkasan Jadwal Maintenance

| Frekuensi | Aksi |
|-----------|------|
| Setiap hari | Cek `docker compose ps` |
| Setiap minggu | Cek log error, cek storage |
| Setiap bulan | `docker system prune`, hapus backup lama |
| Sebelum update | Backup database |
| Setelah update | Jalankan checklist [05-verification.md](05-verification.md) |
