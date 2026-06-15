#!/usr/bin/env sh

# entrypoint.sh for Laravel Docker container
# Waits for MySQL, then starts the PHP dev server

set -e

# Wait for MySQL to be ready
echo "Waiting for MySQL on ${DB_HOST}:${DB_PORT}..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if mysql -h"${DB_HOST}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT 1" 2>/dev/null; then
    echo "MySQL is up!"
    break
  fi
  echo "Attempt $i: MySQL not ready yet, waiting..."
  sleep 3
done

echo "Starting Laravel development server on 0.0.0.0:8000"
php -S 0.0.0.0:8000 -t /var/www/html/public 2>&1
