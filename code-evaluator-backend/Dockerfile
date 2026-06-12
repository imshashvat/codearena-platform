# ============================================================
# CodeArena Backend — Docker Image
# Includes: Node.js 20, Python 3, GCC/G++, Java (OpenJDK 17)
# ============================================================

FROM node:20-slim

# Install compilers and runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3 \
    python3-pip \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME so javac and java are on PATH
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install Node dependencies (production only)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
