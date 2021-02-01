FROM node:13-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package*.json ./
RUN npm install 
COPY . .
RUN npm install -g @nestjs/cli && npm run-script build

EXPOSE 3000
USER 1000
CMD node dist/main
