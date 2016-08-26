# syntax=docker/dockerfile:1

# ---- build stage: compile the bundle and the stylesheet -------------------
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first so the layer caches across source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY javascripts ./javascripts
COPY styles ./styles
RUN npm run build

# ---- runtime stage: static files only, no Node, no toolchain -------------
# nginx-unprivileged runs as uid 101 and listens on 8080 by default.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --chown=nginx:nginx javascript-challenge.html /usr/share/nginx/html/index.html
COPY --chown=nginx:nginx images /usr/share/nginx/html/images
COPY --from=build --chown=nginx:nginx /app/javascript-challenge.js /usr/share/nginx/html/
COPY --from=build --chown=nginx:nginx /app/javascript-challenge.css /usr/share/nginx/html/

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1
