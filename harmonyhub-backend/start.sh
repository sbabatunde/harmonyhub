#!/usr/bin/env bash

# Cache configuration and routes for production speed
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
php artisan migrate --force

# Start the Laravel application server
php artisan serve --host=0.0.0.0 --port=8000