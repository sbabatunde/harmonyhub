#!/usr/bin/env bash
set -e

# Wait for Supabase to be reachable (optional but recommended)
echo "==== Starting Harmonyhub Backend ======="
echo "Running Migration"

# Clear and cache configurations
# php artisan config:cache
# php artisan route:cache
# php artisan view:cache

# Run database migrations against Supabase (only new ones run)
php artisan migrate --force

# Start application server
php artisan serve --host=0.0.0.0 --port=8000