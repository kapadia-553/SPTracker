# ---- build the Angular workspace (context = ./frontend) ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps at workspace root (where angular.json lives)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy full workspace and build the portal app
COPY . .
RUN npx ng build portal --configuration production

# Normalize build output to a single path: /app/out
# Supports Angular <=16 (dist/portal) and Angular 17+ (dist/portal/browser)
RUN set -eux; \
    if [ -d "dist/portal/browser" ]; then \
        echo ">> Using Angular 17+/output: dist/portal/browser"; \
        cp -r dist/portal/browser /app/out; \
    elif [ -d "dist/portal" ]; then \
        echo ">> Using Angular <=16/output: dist/portal"; \
        cp -r dist/portal /app/out; \
    else \
        echo "!! portal build output not found. Listing dist:"; \
        ls -la dist || true; \
        exit 1; \
    fi

# ---- serve with nginx ----
FROM nginx:1.27-alpine
# remove default site and install our site file (server block)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY portal/nginx.conf /etc/nginx/conf.d/default.conf

# copy normalized build output
COPY --from=build /app/out/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
