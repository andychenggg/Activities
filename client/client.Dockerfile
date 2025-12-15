# Build stage
FROM node:18 AS builder

WORKDIR /app

# 因为 context 现在是 ./client，所以这里不写 client/ 前缀
COPY package*.json ./
RUN npm install

# 同理，这里也不能写 client/
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
