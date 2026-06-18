#!/bin/sh
# Run migrations in production
npx prisma migrate deploy

# Start the application using exec to replace the shell process
exec node dist/server.js
