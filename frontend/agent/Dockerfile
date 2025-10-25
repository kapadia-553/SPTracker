# ---- build the Angular workspace (context = ./frontend) ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps at workspace root (where angular.json lives)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy full workspace and build the Agent app
COPY . .
RUN npx ng build agent --configuration production

# Normalize build output to a single path: /app/out
# Supports Angular <=16 (dist/agent) and Angular 17+ (dist/agent/browser)
RUN set -eux; \
    if [ -d "dist/agent/browser" ]; then \
        echo ">> Using Angular 17+/output: dist/agent/browser"; \
        cp -r dist/agent/browser /app/out; \
    elif [ -d "dist/agent" ]; then \
        echo ">> Using Angular <=16/output: dist/agent"; \
        cp -r dist/agent /app/out; \
    else \
        echo "!! Agent build output not found. Listing dist:"; \
        ls -la dist || true; \
        exit 1; \
    fi

# ---- serve with nginx ----
FROM nginx:1.27-alpine
# remove default site and install our site file (server block)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY agent/nginx.conf /etc/nginx/conf.d/default.conf

# copy normalized build output
COPY --from=build /app/out/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
