# 01 — Kebutuhan Server

## Spesifikasi Hardware Minimum

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| CPU | 1 core | 2 core |
| RAM | 1 GB | 2 GB |
| Storage | 10 GB | 20 GB |
| Tipe disk | HDD | SSD |

> Estimasi pemakaian memori saat berjalan:  
> PostgreSQL ≈ 200 MB · Spring Boot ≈ 400 MB · Nginx ≈ 10 MB  
> Total ≈ 650 MB → aman di RAM 1 GB, nyaman di 2 GB.

---

## Sistem Operasi yang Didukung

| OS | Versi | Status |
|----|-------|--------|
| Ubuntu | 22.04 LTS | ✅ Direkomendasikan |
| Ubuntu | 20.04 LTS | ✅ Didukung |
| Debian | 12 (Bookworm) | ✅ Didukung |
| Debian | 11 (Bullseye) | ✅ Didukung |
| CentOS / RHEL | 8+ | ✅ Didukung |
| Windows Server | — | ⚠️ Tidak direkomendasikan |

---

## Software yang Harus Terinstall di Server

| Software | Versi Minimum | Keterangan |
|----------|---------------|------------|
| Docker Engine | 24.x | Wajib |
| Docker Compose | 2.x (plugin) | Wajib (`docker compose`, bukan `docker-compose`) |
| curl | — | Untuk verifikasi deploy |
| Git | — | Opsional, jika clone dari repo |

> **Catatan:** Semua software lain (Java, Maven, Node.js, PostgreSQL) sudah dikemas di dalam container Docker — tidak perlu install di server.

---

## Jaringan & Port

| Port | Service | Akses dari Luar |
|------|---------|----------------|
| 80 | Frontend (Nginx) | ✅ Harus bisa diakses user |
| 4000 | Backend (Spring Boot) | ❌ Tidak perlu — sudah di-proxy Nginx |
| 5432 | PostgreSQL | ❌ Tidak perlu — hanya internal |

**Firewall rules yang perlu dibuka:**
```bash
# Izinkan HTTP dari mana saja
sudo ufw allow 80/tcp

# Izinkan SSH (jangan ditutup!)
sudo ufw allow 22/tcp

sudo ufw enable
```

---

## Akses yang Diperlukan

- SSH ke server (untuk setup dan deploy)
- Hak akses `sudo` atau user `root`
- Server bisa diakses dari jaringan internal perusahaan

---

## Checklist Sebelum Mulai

- [ ] Server sudah bisa di-SSH dari komputer lokal
- [ ] Tahu IP address server (contoh: `192.168.1.100`)
- [ ] Punya akses `sudo` di server
- [ ] Port 80 tidak dipakai aplikasi lain di server
- [ ] Koneksi internet di server (untuk download image Docker)
