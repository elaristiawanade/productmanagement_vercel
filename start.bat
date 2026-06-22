@echo off
:: ============================================================
::  Product Tracker - Production Start Script
::  Edit variables below before first run.
:: ============================================================

set SERVER_PORT=9100
set SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/product_tracker
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=1234
set APP_JWT_SECRET=change_this_to_a_long_random_secret
set APP_JWT_EXPIRATION=604800000
set APP_CORS_ORIGIN=http://localhost:4000
set UPLOAD_DIR=./uploads
set TEAMS_WEBHOOK_URL=

echo Starting Product Tracker on port %SERVER_PORT%...
echo Access: http://localhost:%SERVER_PORT%
echo Press Ctrl+C to stop.
echo.

java -jar "%~dp0backend-java\target\product-tracker-1.0.0.jar"
