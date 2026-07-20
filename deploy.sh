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
  GEO_API_URL
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
VARS="${VARS},GEO_API_URL=${GEO_API_URL}"

# Opcionales: solo se agregan si estan definidas en .env.cloud.
if [ -n "${FLOTA_API_URL}" ]; then
  VARS="${VARS},FLOTA_API_URL=${FLOTA_API_URL}"
else
  echo "Aviso: FLOTA_API_URL no esta definida; el modulo de flota caera al default."
fi
if [ -n "${API_GATEWAY_URL}" ]; then
  VARS="${VARS},API_GATEWAY_URL=${API_GATEWAY_URL}"
fi

# Env vars de BUILD: las NEXT_PUBLIC_* se "inlinean" durante `next build`, no
# existen en runtime, asi que tienen que estar en el entorno del build.
#
# NO se pueden pasar con --set-build-env-vars: cuando el source deploy encuentra
# un Dockerfile, gcloud construye por la ruta Docker, y en esa ruta las build env
# vars se DESCARTAN sin aviso (solo viajan por la ruta buildpacks; el mensaje
# DockerBuild de la API no tiene donde ponerlas). El deploy sale verde y la var
# llega vacia al bundle.
#
# Por eso se escriben en .env.production, que Next lee durante el build.
# .gcloudignore y .dockerignore excluyen .env* pero re-incluyen este archivo con
# "!.env.production". Es efimero (lo borra el trap) y .gitignore lo cubre.
if [ -e .env.production ]; then
  echo "Ya existe .env.production y deploy.sh lo genera. Movelo o borralo y volve a correr."
  exit 1
fi
trap 'rm -f .env.production' EXIT

# La unica NEXT_PUBLIC_ es la clave de Google Maps del selector de ubicaciones:
# config PUBLICA del cliente, protegida por restriccion de referrer/API en Google
# Cloud, no por secreto. Es OPCIONAL: si falta, el mapa se deshabilita y los
# campos se completan a mano.
if [ -n "${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}" ]; then
  printf 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=%s\n' "${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}" > .env.production
else
  echo "Aviso: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no esta definida; el mapa del selector de ubicaciones quedara deshabilitado (los campos se completan a mano)."
fi

gcloud run deploy front-ddd \
  --source . \
  --region=us-central1 \
  --clear-base-image \
  --set-env-vars="${VARS}"
