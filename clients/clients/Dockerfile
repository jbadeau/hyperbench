FROM node:22-alpine
WORKDIR /app
COPY node_modules ./node_modules
COPY hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY clients/clients/ ./clients/clients/
WORKDIR /app/clients/clients
EXPOSE 3002
CMD ["node", "dist/server.js"]
