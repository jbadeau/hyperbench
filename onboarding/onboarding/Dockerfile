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
COPY onboarding/onboarding/ onboarding/onboarding/
RUN npm run build --workspace=hyperbench/hyperbench-shared --workspace=onboarding/onboarding

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY --from=builder /app/onboarding/onboarding ./onboarding/onboarding
WORKDIR /app/onboarding/onboarding
EXPOSE 3003
CMD ["node", "dist/server.js"]
