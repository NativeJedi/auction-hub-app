FROM node:20-alpine AS base
WORKDIR /usr/src/app


FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=optional


FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# Remove dev dependencies
RUN npm prune --omit=dev


FROM node:20-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

CMD ["npm", "run", "start:prod"]
