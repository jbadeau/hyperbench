FROM node:22-alpine
WORKDIR /app
COPY node_modules ./node_modules
COPY hyperbench/hyperbench-shared ./hyperbench/hyperbench-shared
COPY todos/todos/ ./todos/todos/
WORKDIR /app/todos/todos
EXPOSE 3001
CMD ["node", "dist/server.js"]
