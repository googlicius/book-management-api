#!/bin/sh

# Run Prisma migrations
export DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public"

echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations completed successfully!"

# Start the application
echo "Starting application..."
exec "$@"
