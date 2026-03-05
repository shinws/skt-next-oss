# Build stage
FROM node:25.7.0-alpine

WORKDIR /app

# Copy all files first
COPY . .

# Install dependencies
RUN npm install --production

# Create non-root user
RUN addgroup -g 2000 appuser && \
    adduser -D -u 2000 -G appuser appuser

# Change ownership of app
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8081/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 8081

# Start application
CMD ["npm", "start"]
