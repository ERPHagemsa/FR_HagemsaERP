FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .

# Las NEXT_PUBLIC_* se INLINEAN en `next build` y llegan por .env.production, que
# deploy.sh genera y sube con el source (ver el "!.env.production" en
# .dockerignore/.gcloudignore).
#
# NO declarar aquí ARG/ENV NEXT_PUBLIC_*: si el build-arg no llega, `ENV X=$X`
# define X como string VACIO, y @next/env solo aplica el .env cuando la var es
# `undefined` (chequea `typeof`, y `typeof "" === "string"`). O sea: una var
# vacia SHADOWEA al .env.production y el mapa vuelve a quedar deshabilitado.
RUN pnpm run build

FROM base
RUN apk add --no-cache libc6-compat
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
