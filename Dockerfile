# development stage
FROM node:18-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]


# production stage
FROM node:18-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm" , "start"]