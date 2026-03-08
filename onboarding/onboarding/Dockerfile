FROM node:22-alpine
WORKDIR /app
COPY node_modules ./node_modules
COPY hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY onboarding/onboarding/ ./onboarding/onboarding/
WORKDIR /app/onboarding/onboarding
EXPOSE 3003
CMD ["node", "dist/server.js"]
