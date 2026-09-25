#!/usr/bin/env bash

# Clear and cache configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations against Supabase
php artisan migrate --force

# Seed the database (runs only once or safely if using firstOrCreate)
php artisan db:seed --force

# Start application server
php artisan serve --host=0.0.0.0 --port=8000