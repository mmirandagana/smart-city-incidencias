# ===================================================
# Stage 1: Build & Compilation (TypeScript -> JavaScript)
# ===================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json tsconfig.json ./

# Instalar todas las dependencias para compilar TypeScript
RUN npm install

# Copiar código fuente
COPY src/ ./src/

# Compilar proyecto TypeScript a /app/dist
RUN npm run build

# ===================================================
# Stage 2: Production Runtime
# ===================================================
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalar herramientas de compilación necesarias para módulos nativos de C++ (sqlite3 en Alpine)
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar únicamente dependencias de producción
RUN npm install --omit=dev && npm cache clean --force

# Copiar artefactos transpilados desde la etapa de compilación
COPY --from=builder /app/dist ./dist

# Copiar archivos estáticos del Frontend Dual (Dashboard Web y Shell Móvil PWA)
COPY src/public ./src/public
COPY src/public ./dist/public

# Crear directorio para almacenamiento persistente de la base de datos SQLite
RUN mkdir -p /app/data

# Exponer el puerto de la aplicación
EXPOSE 3000

# Iniciar servidor Node.js
CMD ["node", "dist/server.js"]
