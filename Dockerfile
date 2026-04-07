# 1. Use the official lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the package.json and lock files first (for efficient caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of your frontend code
COPY . .

# 6. Expose Vite's default port
EXPOSE 5173

# 7. Start the Vite development server and expose it to the network
CMD ["npm", "run", "dev", "--", "--host"]