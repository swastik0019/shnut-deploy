# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Expose the port your server listens on (adjust if different)
EXPOSE 3000

# Start your backend (adjust the entry point as needed)
CMD ["node", "/index.js"]
