# Node.js 24 Alpine as base image
FROM node:24-alpine

# install OpenSSL and other required dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

# Set up the directory structure to match monorepo
WORKDIR /vura-monorepo

ARG APP_DIR=apps/backend

# Copy package files to the backend directory
COPY ${APP_DIR}/package*.json ./${APP_DIR}/

# Copy shared packages
COPY packages/ ./packages/

# Set working directory to backend
WORKDIR /vura-monorepo/${APP_DIR}

# Install dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --ignore-scripts; \
    else \
      npm install --omit=dev --ignore-scripts; \
    fi

COPY ${APP_DIR} .

RUN npx prisma generate

# set API Gateway stage for asset prefix configuration
ENV API_GATEWAY_STAGE=${API_GATEWAY_STAGE}

# build app and Admin UI
# note: Admin UI build may have warnings but should still work
RUN NODE_ENV=production npx keystone build

# startup script
RUN printf "#!/bin/sh\n" > /app/start.sh && \
    printf "echo 'Running database migrations...'\n" >> /app/start.sh && \
    printf "npx prisma migrate deploy\n" >> /app/start.sh && \
    printf "echo 'Starting Keystone...'\n" >> /app/start.sh && \
    printf "exec npm start\n" >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80

# start app with migrations
CMD ["/bin/sh", "/app/start.sh"] 