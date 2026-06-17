#!/bin/bash
set -e

if [ ! -f .env.cloud ]; then
  echo "No existe .env.cloud"
  exit 1
fi

source .env.cloud

# Variables obligatorias. TODAS las URLs de backend son PLANAS (server-only):
# las consume el BFF (/api/<bc>/*) en runtime. Ya NO se usa NEXT_PUBLIC_ para
# backends (se inlinearia en build y quedaria undefined en el server).
required_vars=(
  AUTH_SERVICE_URL
  ACTIVOS_API_URL
  COMBUSTIBLE_API_URL
  COMERCIAL_API_URL
  SOCIO_NEGOCIOS_API_URL
  CONFIGURACION_GENERAL_API_URL
  NODE_ENV
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name}" ]; then
    echo "Falta configurar ${var_name} en .env.cloud"
    exit 1
  fi
done

# Env vars de RUNTIME: Cloud Run las inyecta y el BFF las lee en cada request.
# Todas las URLs de backend van aca (server-only), NO en build.
VARS="NODE_ENV=${NODE_ENV}"
VARS="${VARS},AUTH_SERVICE_URL=${AUTH_SERVICE_URL}"
VARS="${VARS},ACTIVOS_API_URL=${ACTIVOS_API_URL}"
VARS="${VARS},COMBUSTIBLE_API_URL=${COMBUSTIBLE_API_URL}"
VARS="${VARS},COMERCIAL_API_URL=${COMERCIAL_API_URL}"
VARS="${VARS},SOCIO_NEGOCIOS_API_URL=${SOCIO_NEGOCIOS_API_URL}"
VARS="${VARS},CONFIGURACION_GENERAL_API_URL=${CONFIGURACION_GENERAL_API_URL}"

# Opcionales: solo se agregan si estan definidas en .env.cloud.
if [ -n "${FLOTA_API_URL}" ]; then
  VARS="${VARS},FLOTA_API_URL=${FLOTA_API_URL}"
else
  echo "Aviso: FLOTA_API_URL no esta definida; el modulo de flota caera al default."
fi
if [ -n "${API_GATEWAY_URL}" ]; then
  VARS="${VARS},API_GATEWAY_URL=${API_GATEWAY_URL}"
fi

# Ya no hay variables NEXT_PUBLIC_ de backend: nada que hornear en build salvo
# NODE_ENV. Por eso desaparece la generacion de .env.production.
gcloud run deploy front-ddd \
  --source . \
  --region=us-central1 \
  --clear-base-image \
  --set-build-env-vars="NODE_ENV=${NODE_ENV}" \
  --set-env-vars="${VARS}"
