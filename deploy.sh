#!/bin/bash
set -e

echo "=============================="
echo " Product Tracker — Deploy"
echo "=============================="

# Cek Docker
if ! command -v docker &>/dev/null; then
    echo "ERROR: Docker tidak ditemukan."
    echo "Install: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    echo "ERROR: Docker Compose tidak ditemukan."
    echo "Install: https://docs.docker.com/compose/install/"
    exit 1
fi

# Cek .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "File .env berhasil dibuat dari .env.example"
    echo "Edit .env terlebih dahulu:"
    echo "  nano .env"
    echo ""
    echo "Isi yang wajib diubah:"
    echo "  CORS_ORIGIN  → IP atau domain server ini"
    echo "  JWT_SECRET   → string acak panjang (minimal 32 karakter)"
    echo "  DB_PASSWORD  → password database"
    echo ""
    echo "Setelah edit .env, jalankan script ini lagi."
    exit 1
fi

# Cek nilai placeholder belum diganti
if grep -q "GANTI_DENGAN" .env; then
    echo "ERROR: .env masih mengandung nilai placeholder."
    echo "Edit .env dan ganti semua nilai 'GANTI_DENGAN_...' dulu."
    exit 1
fi

echo "Membangun image Docker..."
docker compose build --no-cache

echo "Menjalankan container..."
docker compose up -d

echo "Menunggu aplikasi siap..."
sleep 10

# Cek apakah frontend bisa diakses
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo ""
    echo "=============================="
    echo " Deploy berhasil!"
    echo " Akses: http://$SERVER_IP"
    echo "=============================="
    echo ""
    echo "Login default:"
    echo "  Email    : admin@company.com"
    echo "  Password : password"
else
    echo ""
    echo "Container berjalan. Cek status dengan:"
    echo "  docker compose ps"
    echo "  docker compose logs -f"
fi
