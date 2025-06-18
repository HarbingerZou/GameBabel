FROM node:18-alpine

# Install Redis CLI tools
RUN apk add --no-cache redis

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Ensure environment variables are available at runtime
ENV NODE_ENV=production

CMD ["npm", "start"] 