FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p downloads/crawler-1 downloads/crawler-2

EXPOSE 3001

CMD ["node", "index.js"] 