FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
# ARG CACHEBUST: passe --build-arg CACHEBUST=$(date +%s) para forçar rebuild ao atualizar código
ARG CACHEBUST
COPY . .
# Gera build.txt com data/hora para conferir no navegador (http://localhost:3000/build.txt)
RUN mkdir -p public && echo "Build: $(date -Iseconds) - Context: $(pwd)" > public/build.txt
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
