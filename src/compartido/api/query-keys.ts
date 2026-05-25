import type {
  ConsultarSociosDeNegocioQuery,
  ExportarSociosDeNegocioQuery,
} from "@/modulos/socio-negocios/tipos/socio-negocio"

export const queryKeys = {
  activos: {
    all: ["activos"] as const,
    listas: () => [...queryKeys.activos.all, "lista"] as const,
    lista: () => [...queryKeys.activos.listas()] as const,
    detalle: (codigo: string) =>
      [...queryKeys.activos.all, "detalle", codigo] as const,
    imagenes: (codigo: string) =>
      [...queryKeys.activos.all, "imagenes", codigo] as const,
  },
  combustible: {
    all: ["combustible"] as const,
    health: () => [...queryKeys.combustible.all, "health"] as const,
    manifiestos: () => [...queryKeys.combustible.all, "manifiestos"] as const,
    solicitudes: () => [...queryKeys.combustible.all, "solicitudes"] as const,
    abastecimientos: () =>
      [...queryKeys.combustible.all, "abastecimientos"] as const,
  },
  socioNegocios: {
    all: ["socio-negocios"] as const,
    estado: () => [...queryKeys.socioNegocios.all, "estado"] as const,
    listas: () => [...queryKeys.socioNegocios.all, "lista"] as const,
    lista: (query?: ConsultarSociosDeNegocioQuery) =>
      [...queryKeys.socioNegocios.listas(), query ?? {}] as const,
    detalle: (id: string) =>
      [...queryKeys.socioNegocios.all, "detalle", id] as const,
    exportacion: (query: ExportarSociosDeNegocioQuery) =>
      [...queryKeys.socioNegocios.all, "exportacion", query] as const,
  },
}
