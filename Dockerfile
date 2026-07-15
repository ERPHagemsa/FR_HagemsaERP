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

# Las NEXT_PUBLIC_* se INLINEAN en `next build`, así que la clave debe estar en
# el entorno de este stage antes del build. deploy.sh la pasa como build-env-var
# (→ --build-arg); sin este ARG/ENV el Dockerfile la descartaba y el mapa quedaba
# deshabilitado en prod. Es config pública (restringida por referrer en GCP), no
# un secreto: bakearla en el bundle del cliente es su uso previsto.
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN pnpm run build

FROM base
RUN apk add --no-cache libc6-compat
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
