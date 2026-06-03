FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8085

ENV PORT=8085

CMD ["node", "main.js"]