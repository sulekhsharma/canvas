# --- Stage 1: Build Client ---
FROM node:20-slim AS client-builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build client
ENV VITE_API_BASE=/api
RUN npm run build --workspace=@gmb-qr/client

# --- Stage 2: Production Server ---
FROM node:20-bullseye-slim

# Install system dependencies for 'canvas' and 'better-sqlite3'
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install ONLY production dependencies
# We use --omit=dev to skip devDeps, but simple npm install is safer for now due to workspace complexity
RUN npm install --omit=dev

# Rebuild native modules (canvas, better-sqlite3)
RUN npm rebuild canvas better-sqlite3

# Copy server source code
COPY server ./server

# Copy built client assets from Stage 1
# We copy them to client/dist because server/src/index.js expects them there:
# app.use(express.static(join(__dirname, '../../client/dist')));
COPY --from=client-builder /app/client/dist ./client/dist

# Create necessary directories
RUN mkdir -p server/public/uploads server/public/generated

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Start server using the root script
CMD ["npm", "start"]
