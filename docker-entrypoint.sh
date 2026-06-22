#!/bin/bash
set -e

DB_NAME="${DB_NAME:-product_tracker}"
DB_PASS="${DB_PASS:-1234}"
APP_PORT="${SERVER_PORT:-9100}"
JWT_SECRET="${APP_JWT_SECRET:-change_this_to_a_long_random_secret}"
JWT_EXP="${APP_JWT_EXPIRATION:-604800000}"

# Detect PostgreSQL version installed
PG_VERSION=$(ls /usr/lib/postgresql/ | sort -V | tail -1)
PG_DATA="/var/lib/postgresql/$PG_VERSION/main"
PG_CTL="/usr/lib/postgresql/$PG_VERSION/bin/pg_ctl"

echo "============================================"
echo " Product Tracker"
echo "============================================"

# ── Init cluster if first run ─────────────────────────────────────────────────
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    echo "[DB] Initializing PostgreSQL $PG_VERSION cluster..."
    mkdir -p "$PG_DATA"
    chown -R postgres:postgres "/var/lib/postgresql"
    su -s /bin/bash postgres -c "/usr/lib/postgresql/$PG_VERSION/bin/initdb -D $PG_DATA --auth-local trust --auth-host md5 -U postgres" -q
    echo "listen_addresses = '*'"                >> "$PG_DATA/postgresql.conf"
    echo "host all all 0.0.0.0/0 md5"           >> "$PG_DATA/pg_hba.conf"
fi

# ── Start PostgreSQL ──────────────────────────────────────────────────────────
echo "[1/3] Starting PostgreSQL..."
mkdir -p /var/log/postgresql && chown postgres:postgres /var/log/postgresql
su -s /bin/bash postgres -c "$PG_CTL -D $PG_DATA -l /var/log/postgresql/pg.log start -w -t 30"

# Set postgres password
su -s /bin/bash postgres -c "psql -U postgres -c \"ALTER USER postgres WITH PASSWORD '$DB_PASS';\"" > /dev/null

# ── Create & init database ────────────────────────────────────────────────────
echo "[2/3] Setting up database '$DB_NAME'..."
DB_EXISTS=$(su -s /bin/bash postgres -c "psql -U postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME';\"")
if [ "$DB_EXISTS" != "1" ]; then
    su -s /bin/bash postgres -c "psql -U postgres -c \"CREATE DATABASE $DB_NAME;\""
fi

TABLE_EXISTS=$(su -s /bin/bash postgres -c "psql -U postgres -d $DB_NAME -tAc \"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users');\"")
if [ "$TABLE_EXISTS" = "f" ]; then
    echo "    Running schema + migrations + seed..."
    for f in $(ls /app/sql/*.sql | sort); do
        su -s /bin/bash postgres -c "psql -U postgres -d $DB_NAME -f $f" > /dev/null 2>&1 \
            && echo "    OK $(basename $f)" \
            || echo "    SKIP $(basename $f) (safe to ignore)"
    done
else
    echo "    Database already initialized."
fi

# ── Graceful shutdown ─────────────────────────────────────────────────────────
shutdown() {
    echo "Stopping..."
    [ -n "$JAVA_PID" ] && kill "$JAVA_PID" 2>/dev/null && wait "$JAVA_PID" 2>/dev/null
    su -s /bin/bash postgres -c "$PG_CTL -D $PG_DATA stop -m fast" 2>/dev/null
    exit 0
}
trap shutdown SIGTERM SIGINT

# ── Start application ─────────────────────────────────────────────────────────
echo "[3/3] Starting app on port $APP_PORT..."
mkdir -p /app/uploads

java -jar /app/app.jar \
    --server.port="$APP_PORT" \
    --spring.datasource.url="jdbc:postgresql://127.0.0.1:5432/$DB_NAME" \
    --spring.datasource.username="postgres" \
    --spring.datasource.password="$DB_PASS" \
    --app.jwt.secret="$JWT_SECRET" \
    --app.jwt.expiration="$JWT_EXP" \
    --upload.dir="/app/uploads" &
JAVA_PID=$!

echo "============================================"
echo " Ready at http://localhost:$APP_PORT"
echo " Login: admin@admin.com / 1234"
echo "============================================"

wait "$JAVA_PID"
