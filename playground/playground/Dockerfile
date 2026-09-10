FROM node:22-alpine
WORKDIR /app
COPY node_modules ./node_modules
COPY hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY playground/playground/ ./playground/playground/
WORKDIR /app/playground/playground
EXPOSE 3004
CMD ["node", "dist/server.js"]
