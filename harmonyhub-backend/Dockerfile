FROM php:8.4-fpm

# Install system dependencies & Postgres extensions
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy project files
COPY . .

# Install dependencies and optimize autoloader
RUN composer install --no-dev --optimize-autoloader

# Remove any stale config cache committed from local dev
RUN php artisan config:clear || true \
    && php artisan route:clear || true \
    && php artisan view:clear || true

# --- Upload configuration ---
# Copy custom PHP upload settings
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Create writable upload and storage directories, then set ownership
RUN mkdir -p /var/www/html/storage/app/upload-tmp \
    && mkdir -p /var/www/html/storage/app/public \
    && mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Copy entrypoint script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8000

ENTRYPOINT ["/start.sh"]