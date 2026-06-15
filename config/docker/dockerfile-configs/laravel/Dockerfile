FROM php:8.2-apache

# Enable Apache modules
RUN a2enmod rewrite

# Install system dependencies including Composer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    mariadb-client \
    git \
    unzip \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql 2>&1 || true

# Configure Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Copy application files
COPY ./api /var/www/html/

# Install Laravel dependencies with Composer
RUN composer install --no-dev --optimize-autoloader --no-interaction 2>&1 && \
    chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
