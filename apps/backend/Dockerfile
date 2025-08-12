# Node.js 24 Alpine as base image
FROM node:24-alpine

# install OpenSSL and other required dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

ARG APP_DIR=.

COPY ${APP_DIR}/package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev --ignore-scripts; \
    else \
      npm install --omit=dev --ignore-scripts; \
    fi

COPY ${APP_DIR} .

RUN npx prisma generate

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