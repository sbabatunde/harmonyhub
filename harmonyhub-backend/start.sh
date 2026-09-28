#!/usr/bin/env bash
set -e

echo "===== Starting HarmonyHub Backend ====="

# Ensure runtime directories exist and are writable
mkdir -p storage/app/upload-tmp
mkdir -p storage/app/public
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# --- Config cache: clear stale cache, rebuild from current env ---
echo "Clearing and rebuilding config cache..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force

echo "Starting server on 0.0.0.0:8000..."
php artisan serve --host=0.0.0.0 --port=8000