FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build
EXPOSE 4000
CMD ["sh","-c","npx prisma migrate deploy && npm start"]
