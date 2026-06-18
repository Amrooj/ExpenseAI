# ============================================================
# Frontend Dockerfile — Multi-Stage Build
# ============================================================

# ── Stage 1: Base ───────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

# ── Stage 2: Development ────────────────────────────────────
FROM base AS development

COPY package*.json ./
RUN npm ci

COPY . .

USER node
EXPOSE 5173

# Vite dev server with hot reload
CMD ["dumb-init", "npx", "vite", "--host", "0.0.0.0"]

# ── Stage 3: Builder — compile production bundle ─────────────
FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY . .

# Build the React app into static HTML/CSS/JS files
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
# Output is in ./dist — static files ready to serve

# ── Stage 4: Production — serve with nginx ───────────────────
FROM nginx:alpine AS production
# nginx: high-performance static file server and reverse proxy
# Perfect for serving a React SPA in production

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React Router (SPA routing)
# Without this, refreshing /dashboard would return 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
