#!/bin/bash
set -e

echo "Running database migrations..."

# Run migrations in order
for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $(basename $migration)"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$migration"
  fi
done

echo "Running database seeds..."

# Run seeds in order
for seed in /docker-entrypoint-initdb.d/seeds/*.sql; do
  if [ -f "$seed" ]; then
    echo "Running seed: $(basename $seed)"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$seed"
  fi
done

echo "Database initialization complete!"

