# Code generated by do-tools.
FROM node:slim

WORKDIR /app
COPY package*.json .
COPY tsconfig.json .
COPY index.js .
COPY src /app/src

RUN npm install
RUN npm run build

CMD [ "node", "." ]