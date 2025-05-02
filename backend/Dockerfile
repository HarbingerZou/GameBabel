FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the application with environment variables
ARG NEXT_PUBLIC_CRAWLER_URL
ARG NEXT_PUBLIC_DATA_PERSISTENCE_URL
ENV NEXT_PUBLIC_CRAWLER_URL=$NEXT_PUBLIC_CRAWLER_URL
ENV NEXT_PUBLIC_DATA_PERSISTENCE_URL=$NEXT_PUBLIC_DATA_PERSISTENCE_URL

RUN npm run build

EXPOSE 3000

# Ensure environment variables are available at runtime
ENV NODE_ENV=production

CMD ["npm", "start"] 