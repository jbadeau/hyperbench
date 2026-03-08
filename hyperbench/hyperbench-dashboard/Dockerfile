FROM node:22-alpine
WORKDIR /app
COPY node_modules ./node_modules
COPY hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY hyperbench/hyperbench-dashboard/ ./hyperbench/hyperbench-dashboard/
WORKDIR /app/hyperbench/hyperbench-dashboard
EXPOSE 3000
CMD ["node", "dist/server.js"]
