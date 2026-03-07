FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY hyperbench/hyperbench-shared/package.json hyperbench/hyperbench-shared/
COPY hyperbench/hyperbench-dashboard/package.json hyperbench/hyperbench-dashboard/
COPY todos/todos/package.json todos/todos/
COPY clients/clients/package.json clients/clients/
COPY onboarding/onboarding/package.json onboarding/onboarding/
RUN npm ci
COPY hyperbench/hyperbench-shared/ hyperbench/hyperbench-shared/
COPY clients/clients/ clients/clients/
RUN npm run build --workspace=hyperbench/hyperbench-shared --workspace=clients/clients

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY --from=builder /app/clients/clients ./clients/clients
WORKDIR /app/clients/clients
EXPOSE 3002
CMD ["node", "dist/server.js"]
