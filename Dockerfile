# build stage
FROM node:22-alpine AS build-stage
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d/
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]