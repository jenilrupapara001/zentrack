FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# ZenTrack Backend usually operates on 5002
EXPOSE 5002

# Use environment variables to control port at runtime
ENV PORT=5002

CMD ["node", "server.js"]
