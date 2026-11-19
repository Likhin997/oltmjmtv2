FROM node:22-alpine

# Install build tools for native SQLite driver
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json .npmrc* ./
RUN npm install --legacy-peer-deps

COPY . .

# Build frontend production assets into /app/dist
RUN npm run build

# Persist local backup directory & lock permissions for non-root runtime user
RUN mkdir -p /app/data && chown -R node:node /app/data /app/dist

ENV NODE_ENV=production
ENV PORT=3006
ENV BIND_HOST=0.0.0.0
ENV PG_HOST=smartolt-postgres
ENV PG_PORT=5436
ENV PG_USER=likhin
ENV PG_DATABASE=smartolt_db

USER node

EXPOSE 3006

CMD ["npx", "tsx", "server.ts"]
