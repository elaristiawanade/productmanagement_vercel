# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:18-alpine AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend JAR ────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-11 AS backend
WORKDIR /build
COPY backend-java/pom.xml ./
RUN mvn dependency:go-offline -q
COPY backend-java/src ./src
COPY --from=frontend /build/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -q

# ── Stage 3: Runtime (Java 11 + PostgreSQL) ───────────────────────────────────
FROM eclipse-temurin:11-jre-jammy

RUN apt-get update -q && \
    apt-get install -y -q postgresql && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend /build/target/product-tracker-1.0.0.jar /app/app.jar

COPY backend/db/schema.sql        /app/sql/01-schema.sql
COPY backend/db/migration_v2.sql  /app/sql/02-migration_v2.sql
COPY backend/db/migration_v3.sql  /app/sql/03-migration_v3.sql
COPY backend/db/migration_v4.sql  /app/sql/04-migration_v4.sql
COPY backend/db/migration_v5.sql  /app/sql/05-migration_v5.sql
COPY backend/db/seed.sql          /app/sql/06-seed.sql

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME ["/var/lib/postgresql", "/app/uploads"]
EXPOSE 9100

CMD ["/entrypoint.sh"]
