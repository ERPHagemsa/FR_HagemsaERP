// Constructores de arbol jerarquico y aplanado de la respuesta /ubicaciones/
// jerarquia. Logica pura sin JSX, extraida de configuracion-general-listados.tsx.

import type {
  ConfiguracionGeneralResponse,
  UbicacionJerarquiaResponse,
} from "../../tipos/configuracion-general"
import type { TipoJerarquico, TipoListado } from "./utilidades"

export interface NodoJerarquia {
  clave: string
  titulo: string
  descripcion: string
  etiqueta: string
  dato?: ConfiguracionGeneralResponse
  hijos: NodoJerarquia[]
}

function ordenarPorNombre(
  datos: ConfiguracionGeneralResponse[],
): ConfiguracionGeneralResponse[] {
  return [...datos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

function construirJerarquiaCargos(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const mapa = new Map(datos.map((dato) => [dato.id, dato]))
  const hijosPorPadre = new Map<number, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    if (dato.cargoSuperiorId == null || !mapa.has(dato.cargoSuperiorId)) return
    const hijos = hijosPorPadre.get(dato.cargoSuperiorId) ?? []
    hijos.push(dato)
    hijosPorPadre.set(dato.cargoSuperiorId, hijos)
  })

  const visitados = new Set<number>()
  const crearNodo = (
    dato: ConfiguracionGeneralResponse,
    ruta: Set<number>,
  ): NodoJerarquia => {
    visitados.add(dato.id)
    const siguienteRuta = new Set(ruta).add(dato.id)
    const hijos = ordenarPorNombre(hijosPorPadre.get(dato.id) ?? [])
      .filter((hijo) => !siguienteRuta.has(hijo.id))
      .map((hijo) => crearNodo(hijo, siguienteRuta))

    return {
      clave: `cargo-${dato.id}`,
      titulo: dato.nombre,
      descripcion: dato.descripcion || dato.codigo,
      etiqueta: dato.cargoSuperiorId == null ? "Cargo principal" : "Reporta a otro cargo",
      dato,
      hijos,
    }
  }

  const raices = ordenarPorNombre(
    datos.filter(
      (dato) => dato.cargoSuperiorId == null || !mapa.has(dato.cargoSuperiorId),
    ),
  ).map((dato) => crearNodo(dato, new Set()))

  ordenarPorNombre(datos)
    .filter((dato) => !visitados.has(dato.id))
    .forEach((dato) => raices.push(crearNodo(dato, new Set())))

  return raices
}

function construirJerarquiaAreas(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposSede = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.sedeId ?? "sin-sede"}:${dato.sedeNombre ?? "Sin sede"}`
    const grupo = gruposSede.get(clave) ?? []
    grupo.push(dato)
    gruposSede.set(clave, grupo)
  })

  return [...gruposSede.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.sedeNombre ?? "Sin sede").localeCompare(
        b[0]?.sedeNombre ?? "Sin sede",
        "es",
      ),
    )
    .map(([claveSede, grupo]) => {
      const gerencias = ordenarPorNombre(
        grupo.filter((dato) => dato.nivelArea === "GERENCIA"),
      )
      const areas = ordenarPorNombre(
        grupo.filter((dato) => dato.nivelArea !== "GERENCIA"),
      )
      const idsGerencia = new Set(gerencias.map((gerencia) => gerencia.id))
      const nodosGerencia = gerencias.map((gerencia) => ({
        clave: `area-${gerencia.id}`,
        titulo: gerencia.nombre,
        descripcion: gerencia.descripcion || gerencia.codigo,
        etiqueta: "Gerencia",
        dato: gerencia,
        hijos: areas
          .filter((area) => area.gerenciaId === gerencia.id)
          .map((area) => ({
            clave: `area-${area.id}`,
            titulo: area.nombre,
            descripcion: area.descripcion || area.codigo,
            etiqueta: "Area",
            dato: area,
            hijos: [],
          })),
      }))
      const areasSinGerencia = areas
        .filter(
          (area) => area.gerenciaId == null || !idsGerencia.has(area.gerenciaId),
        )
        .map((area) => ({
          clave: `area-${area.id}`,
          titulo: area.nombre,
          descripcion: area.descripcion || area.codigo,
          etiqueta: area.gerenciaNombre
            ? `Area de ${area.gerenciaNombre}`
            : "Area sin gerencia",
          dato: area,
          hijos: [],
        }))

      return {
        clave: `sede-${claveSede}`,
        titulo: grupo[0]?.sedeNombre || "Sin sede asignada",
        descripcion: "Areas de esta sede",
        etiqueta: "Sede",
        hijos: [...nodosGerencia, ...areasSinGerencia],
      }
    })
}

function construirJerarquiaSedes(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposUbicacion = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.ubicacionId ?? "sin-ubicacion"}:${dato.ubicacionNombre ?? "Sin ubicacion"}`
    const grupo = gruposUbicacion.get(clave) ?? []
    grupo.push(dato)
    gruposUbicacion.set(clave, grupo)
  })

  return [...gruposUbicacion.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.ubicacionNombre ?? "Sin ubicacion").localeCompare(
        b[0]?.ubicacionNombre ?? "Sin ubicacion",
        "es",
      ),
    )
    .map(([clave, grupo]) => ({
      clave: `ubicacion-${clave}`,
      titulo: grupo[0]?.ubicacionNombre || "Sin ubicacion asignada",
      descripcion: "Sedes de esta ubicacion",
      etiqueta: "Ubicacion",
      hijos: ordenarPorNombre(grupo).map((sede) => ({
        clave: `sede-${sede.id}`,
        titulo: sede.nombre,
        descripcion: sede.descripcion || sede.codigo,
        etiqueta: "Sede",
        dato: sede,
        hijos: [],
      })),
    }))
}

function construirJerarquiaAlmacenes(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposUbicacion = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.ubicacionId ?? "sin-ubicacion"}:${dato.ubicacionNombre ?? "Sin ubicacion"}`
    const grupo = gruposUbicacion.get(clave) ?? []
    grupo.push(dato)
    gruposUbicacion.set(clave, grupo)
  })

  return [...gruposUbicacion.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.ubicacionNombre ?? "Sin ubicacion").localeCompare(
        b[0]?.ubicacionNombre ?? "Sin ubicacion",
        "es",
      ),
    )
    .map(([claveUbicacion, grupo]) => {
      const gruposSede = new Map<string, ConfiguracionGeneralResponse[]>()
      const sinSede: ConfiguracionGeneralResponse[] = []

      grupo.forEach((almacen) => {
        if (almacen.sedeId == null) {
          sinSede.push(almacen)
          return
        }
        const claveSede = `${almacen.sedeId}:${almacen.sedeNombre ?? "Sin nombre"}`
        const almacenes = gruposSede.get(claveSede) ?? []
        almacenes.push(almacen)
        gruposSede.set(claveSede, almacenes)
      })

      const crearNodoAlmacen = (almacen: ConfiguracionGeneralResponse): NodoJerarquia => ({
        clave: `almacen-${almacen.id}`,
        titulo: almacen.nombre,
        descripcion: almacen.descripcion || almacen.codigo,
        etiqueta: almacen.esTemporal ? "Almacen temporal" : "Almacen fijo",
        dato: almacen,
        hijos: [],
      })
      const sedes = [...gruposSede.entries()]
        .sort(([, a], [, b]) =>
          (a[0]?.sedeNombre ?? "Sin sede").localeCompare(
            b[0]?.sedeNombre ?? "Sin sede",
            "es",
          ),
        )
        .map(([claveSede, almacenes]) => ({
          clave: `sede-almacen-${claveSede}`,
          titulo: almacenes[0]?.sedeNombre || "Sin sede asignada",
          descripcion: "Sede",
          etiqueta: "Sede",
          hijos: ordenarPorNombre(almacenes).map(crearNodoAlmacen),
        }))

      return {
        clave: `ubicacion-almacen-${claveUbicacion}`,
        titulo: grupo[0]?.ubicacionNombre || "Sin ubicacion asignada",
        descripcion: "Almacenes de esta ubicacion",
        etiqueta: "Ubicacion",
        hijos: [
          ...sedes,
          ...ordenarPorNombre(sinSede).map(crearNodoAlmacen),
        ],
      }
    })
}

function construirJerarquiaContratos(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const mapa = new Map(datos.map((dato) => [dato.id, dato]))
  const hijosPorPadre = new Map<number, ConfiguracionGeneralResponse[]>()
  const raices: ConfiguracionGeneralResponse[] = []

  datos.forEach((dato) => {
    const padre = dato.contratoPadreId == null ? undefined : mapa.get(dato.contratoPadreId)
    const nivel = dato.nivelCuentaContrato ?? 2
    const padreEsContrato =
      nivel > 2 &&
      padre != null &&
      (padre.nivelCuentaContrato ?? 0) < nivel

    if (!padreEsContrato || !padre) {
      raices.push(dato)
      return
    }

    const hijos = hijosPorPadre.get(padre.id) ?? []
    hijos.push(dato)
    hijosPorPadre.set(padre.id, hijos)
  })

  const crearNodo = (dato: ConfiguracionGeneralResponse): NodoJerarquia => ({
    clave: `contrato-${dato.id}`,
    titulo: dato.nombre,
    descripcion: dato.descripcion || dato.codigo,
    etiqueta: "Contrato",
    dato,
    hijos: ordenarPorNombre(hijosPorPadre.get(dato.id) ?? []).map(crearNodo),
  })
  const gruposRaiz = new Map<string, ConfiguracionGeneralResponse[]>()

  raices.forEach((dato) => {
    const clave = `${dato.contratoPadreId ?? "sin-padre"}:${dato.contratoPadreNombre ?? "Sin padre"}`
    const grupo = gruposRaiz.get(clave) ?? []
    grupo.push(dato)
    gruposRaiz.set(clave, grupo)
  })

  return [...gruposRaiz.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.contratoPadreNombre ?? "Sin padre").localeCompare(
        b[0]?.contratoPadreNombre ?? "Sin padre",
        "es",
      ),
    )
    .map(([clave, grupo]) => ({
      clave: `padre-${clave}`,
      titulo: grupo[0]?.contratoPadreNombre || "Sin cuenta o contrato principal",
      descripcion: "Contratos que dependen de aqui",
      etiqueta: "Cuenta o contrato principal",
      hijos: ordenarPorNombre(grupo).map(crearNodo),
    }))
}

export function construirJerarquia(
  tipo: TipoJerarquico,
  datos: ConfiguracionGeneralResponse[],
) {
  if (tipo === "CARGO") return construirJerarquiaCargos(datos)
  if (tipo === "AREA") return construirJerarquiaAreas(datos)
  if (tipo === "SEDE") return construirJerarquiaSedes(datos)
  if (tipo === "ALMACEN") return construirJerarquiaAlmacenes(datos)
  return construirJerarquiaContratos(datos)
}

// Tipos cuyo arbol cuelga de la ubicacion: se sirven con el endpoint especifico
// /ubicaciones/jerarquia en una sola llamada, en vez de listar el tipo plano y
// agrupar en el navegador (que truncaba a la primera pagina).
export type TipoDesdeJerarquia = "SEDE" | "AREA" | "ALMACEN"

export function esTipoDesdeJerarquia(tipo: TipoListado): tipo is TipoDesdeJerarquia {
  return tipo === "SEDE" || tipo === "AREA" || tipo === "ALMACEN"
}

// Aplana la respuesta anidada de /ubicaciones/jerarquia al tipo pedido,
// inyectando las referencias del padre (ubicacion/sede) que el anidamiento da por
// implicitas. Asi los constructores de arbol y el formulario de edicion reciben
// registros completos.
export function aplanarDesdeJerarquia(
  tipo: TipoDesdeJerarquia,
  ubicaciones: UbicacionJerarquiaResponse[],
): ConfiguracionGeneralResponse[] {
  const salida: ConfiguracionGeneralResponse[] = []
  // Evita ids repetidos: un mismo almacen puede venir anidado en su sede y, a la
  // vez, colgado directamente de la ubicacion. Sin esto, el arbol genera dos
  // nodos con la misma key (ej. "almacen-1").
  const vistos = new Set<number>()
  const agregar = (registro: ConfiguracionGeneralResponse) => {
    if (vistos.has(registro.id)) return
    vistos.add(registro.id)
    salida.push(registro)
  }

  for (const ubicacion of ubicaciones) {
    const sedes = ubicacion.sedes ?? []

    if (tipo === "SEDE") {
      for (const sede of sedes) {
        agregar({
          ...sede,
          tipoDatoMaestro: sede.tipoDatoMaestro ?? "SEDE",
          ubicacionId: sede.ubicacionId ?? ubicacion.id,
          ubicacionNombre: sede.ubicacionNombre ?? ubicacion.nombre,
        })
      }
      continue
    }

    if (tipo === "AREA") {
      for (const sede of sedes) {
        for (const area of sede.areas ?? []) {
          agregar({
            ...area,
            tipoDatoMaestro: area.tipoDatoMaestro ?? "AREA",
            sedeId: area.sedeId ?? sede.id,
            sedeNombre: area.sedeNombre ?? sede.nombre,
          })
        }
      }
      continue
    }

    // ALMACEN: anidados bajo cada sede + los colgados directo de la ubicacion.
    for (const sede of sedes) {
      for (const almacen of sede.almacenes ?? []) {
        agregar({
          ...almacen,
          tipoDatoMaestro: almacen.tipoDatoMaestro ?? "ALMACEN",
          ubicacionId: almacen.ubicacionId ?? ubicacion.id,
          ubicacionNombre: almacen.ubicacionNombre ?? ubicacion.nombre,
          sedeId: almacen.sedeId ?? sede.id,
          sedeNombre: almacen.sedeNombre ?? sede.nombre,
        })
      }
    }
    for (const almacen of ubicacion.almacenes ?? []) {
      agregar({
        ...almacen,
        tipoDatoMaestro: almacen.tipoDatoMaestro ?? "ALMACEN",
        ubicacionId: almacen.ubicacionId ?? ubicacion.id,
        ubicacionNombre: almacen.ubicacionNombre ?? ubicacion.nombre,
      })
    }
  }

  return salida
}

// Frase en lenguaje natural que explica a que pertenece un registro, para que la
// relacion quede clara incluso fuera del arbol.
export function relacionResumen(dato: ConfiguracionGeneralResponse): string | null {
  switch (dato.tipoDatoMaestro) {
    case "SEDE":
      return dato.ubicacionNombre ? `Ubicacion: ${dato.ubicacionNombre}` : null
    case "AREA": {
      const partes: string[] = []
      if (dato.sedeNombre) partes.push(`Sede: ${dato.sedeNombre}`)
      if (dato.nivelArea === "AREA" && dato.gerenciaNombre) {
        partes.push(`Gerencia: ${dato.gerenciaNombre}`)
      }
      return partes.length > 0 ? partes.join(" · ") : null
    }
    case "ALMACEN": {
      const partes: string[] = []
      if (dato.ubicacionNombre) partes.push(`Ubicacion: ${dato.ubicacionNombre}`)
      if (dato.sedeNombre) partes.push(`Sede: ${dato.sedeNombre}`)
      return partes.length > 0 ? partes.join(" · ") : null
    }
    case "CARGO":
      return dato.cargoSuperiorNombre ? `Reporta a: ${dato.cargoSuperiorNombre}` : null
    case "CONTRATO":
      return dato.contratoPadreNombre ? `Pertenece a: ${dato.contratoPadreNombre}` : null
    default:
      return null
  }
}
