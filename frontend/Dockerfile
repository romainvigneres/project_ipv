# ── Stage 1: build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: serve with Nginx ──────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: all routes serve index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
