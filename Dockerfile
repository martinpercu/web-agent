FROM node:20-alpine

RUN npm install -g opencode-ai

WORKDIR /app
COPY backend/opencode.json ./
COPY backend/INSTRUCTIONS.md ./

EXPOSE 4096

CMD ["opencode", "serve", "--port", "4096", "--hostname", "0.0.0.0"]