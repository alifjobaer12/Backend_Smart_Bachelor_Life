FROM node:20-alpine

WORKDIR /app

# Install only production dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source.
COPY . .

# Ensure log directory exists and can be written by non-root user.
RUN mkdir -p logs && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "start"]
