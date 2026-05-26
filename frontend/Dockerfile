FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
