# 05 — Verifikasi Setelah Deploy

Gunakan checklist ini untuk memastikan aplikasi berjalan dengan benar.

---

## Checklist Cepat

```bash
# Ganti 192.168.1.100 dengan IP server yang sebenarnya
SERVER_IP=192.168.1.100
```

### ✅ 1. Container berjalan

```bash
docker compose ps
```
Semua service harus berstatus `Up` atau `Up (healthy)`.

---

### ✅ 2. Frontend bisa diakses

Buka browser dan akses:
```
http://192.168.1.100
```

Halaman login Product Tracker harus muncul.

Atau via terminal:
```bash
curl -s -o /dev/null -w "%{http_code}" http://192.168.1.100
# Harus muncul: 200
```

---

### ✅ 3. API backend merespons

```bash
curl -s http://192.168.1.100/api/health 2>/dev/null || \
curl -s -o /dev/null -w "%{http_code}" http://192.168.1.100/api/products \
  -H "Authorization: Bearer dummy"
# Harus muncul: 401 (unauthorized — artinya backend berjalan)
```

---

### ✅ 4. Login berhasil

Di browser:
- Buka `http://192.168.1.100`
- Email: `admin@company.com`
- Password: `password`
- Harus masuk ke halaman Dashboard

Atau via terminal (uji API login):
```bash
curl -s -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password"}' \
  | grep -o '"token":"[^"]*"' | head -c 50
# Harus muncul: "token":"eyJhbGci...
```

---

### ✅ 5. Semua modul dapat dibuka

Setelah login, buka dan pastikan masing-masing halaman tampil tanpa error:

| Modul | URL | Yang Diharapkan |
|-------|-----|-----------------|
| Dashboard | `http://IP/` | Statistik 3 produk |
| Backlog | `http://IP/backlog` | Daftar backlog items |
| Sprint | `http://IP/sprints` | Daftar sprint |
| Produk | `http://IP/products` | 3 produk (INT-APP, TREASURY, SMARTIN) |
| Users | `http://IP/users` | 7 user terdaftar |
| QA | `http://IP/qa` | Test cases & runs |

---

### ✅ 6. Tambah data baru (uji CRUD)

Uji fungsi tambah di setiap modul:

- [ ] Tambah produk baru
- [ ] Tambah backlog item (story) di produk tersebut
- [ ] Tambah sprint di produk tersebut
- [ ] Tambah user baru
- [ ] Tambah epic dan feature

---

### ✅ 7. Ganti password akun default

> **WAJIB dilakukan setelah deploy!**

Login sebagai setiap user dan ganti password dari `password` ke password baru yang kuat.

Atau admin bisa reset via halaman Users → pilih user → Reset Password.

---

## Uji Fungsional Lengkap (Opsional)

Untuk uji yang lebih menyeluruh, jalankan dari server:

```bash
# Login dan simpan token
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password"}' \
  | grep -oP '"token":"\K[^"]+')

# Cek semua endpoint utama
for ENDPOINT in products sprints users epics features; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost/api/$ENDPOINT \
    -H "Authorization: Bearer $TOKEN")
  echo "$ENDPOINT: HTTP $STATUS"
done
```

Output yang diharapkan:
```
products: HTTP 200
sprints: HTTP 200
users: HTTP 200
epics: HTTP 200
features: HTTP 200
```

---

## Tanda Aplikasi Berjalan Normal

- ✅ Halaman login muncul tanpa error console
- ✅ Login berhasil dan diarahkan ke dashboard
- ✅ Data (produk, sprint, backlog) tampil di setiap halaman
- ✅ Tambah/edit/hapus data berfungsi
- ✅ Tidak ada pesan "Internal Server Error" di manapun
- ✅ `docker compose ps` semua `Up`

---

## Jika Ada Masalah

Lihat **[07-troubleshooting.md](07-troubleshooting.md)** untuk panduan penyelesaian masalah.
