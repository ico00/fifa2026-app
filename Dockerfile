FROM node:18-alpine

WORKDIR /app

# Kopiraj package files
COPY package*.json ./

# Instaliraj dependencies
RUN npm ci

# Kopiraj sve fajlove
COPY . .

# Build frontend
RUN npm run build

# Eksponiraj port
EXPOSE 3001

# Start server (server će servirati i frontend i backend)
CMD ["node", "server/index.cjs"]
