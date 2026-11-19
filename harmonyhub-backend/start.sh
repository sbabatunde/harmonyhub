#!/usr/bin/env bash
set -e

# Ensure runtime directories exist and are writable
mkdir -p storage/app/upload-tmp \
         storage/app/public \
         storage/framework/cache \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Clear and rebuild config cache from current Render env vars
echo "Clearing and rebuilding config cache..."
php artisan config:clear
php artisan config:cache

# Use a custom variable name (Render overwrites RENDER_SERVICE_TYPE with "web")
if [ "$APP_SERVICE_ROLE" = "reverb" ]; then
    echo "Starting Reverb server on 0.0.0.0:${PORT:-10000}..."
    exec php artisan reverb:start --host=0.0.0.0 --port=${PORT:-10000}
fi

echo "===== Starting HarmonyHub Backend ====="
php artisan route:clear
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force

echo "Starting server on 0.0.0.0:${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
