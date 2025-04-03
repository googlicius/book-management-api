# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run generate:types
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/**/*.graphql ./dist/
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

RUN npx prisma generate
RUN chmod +x ./scripts/migrate-database.sh

EXPOSE 3000

ENTRYPOINT ["./scripts/migrate-database.sh"]
CMD ["node", "dist/main"]
