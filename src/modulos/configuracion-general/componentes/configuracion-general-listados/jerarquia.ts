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
      // Se antepone el area para que en el arbol se vea de un vistazo a que area
      // pertenece cada cargo (util cuando la misma area existe en varias sedes).
      descripcion: dato.areaNombre
        ? `${dato.areaNombre} · ${dato.descripcion || dato.codigo}`
        : dato.descripcion || dato.codigo,
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

// Etiqueta segun posicion real en el arbol (no solo nivelArea, que es libre):
// raiz = "Gerencia" si asi se marco, si no "Area"; con padre = "Sub-area".
function etiquetaArea(area: ConfiguracionGeneralResponse): string {
  if (area.gerenciaId == null) {
    return area.nivelArea === "GERENCIA" ? "Gerencia" : "Area"
  }
  return area.nivelArea === "GERENCIA" ? "Gerencia dependiente" : "Sub-area"
}

// Areas: jerarquia recursiva de profundidad ilimitada via gerenciaId, agrupada
// por sede. gerenciaId apunta a otra Area (null = raiz). nivelArea es solo una
// etiqueta y NO limita la profundidad; el arbol se arma por gerenciaId, igual que
// cargos por cargoSuperiorId. Se protege contra ciclos con la ruta visitada.
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
      // Solo se considera padre a una area de la MISMA sede; si el gerenciaId
      // apunta fuera del grupo, el area se trata como raiz de esta sede.
      const idsEnSede = new Set(grupo.map((area) => area.id))
      const hijosPorPadre = new Map<number, ConfiguracionGeneralResponse[]>()

      grupo.forEach((area) => {
        if (area.gerenciaId == null || !idsEnSede.has(area.gerenciaId)) return
        const hijos = hijosPorPadre.get(area.gerenciaId) ?? []
        hijos.push(area)
        hijosPorPadre.set(area.gerenciaId, hijos)
      })

      const visitados = new Set<number>()
      const crearNodo = (
        area: ConfiguracionGeneralResponse,
        ruta: Set<number>,
      ): NodoJerarquia => {
        visitados.add(area.id)
        const siguienteRuta = new Set(ruta).add(area.id)
        const hijos = ordenarPorNombre(hijosPorPadre.get(area.id) ?? [])
          .filter((hijo) => !siguienteRuta.has(hijo.id))
          .map((hijo) => crearNodo(hijo, siguienteRuta))

        return {
          clave: `area-${area.id}`,
          titulo: area.nombre,
          descripcion: area.descripcion || area.codigo,
          etiqueta: etiquetaArea(area),
          dato: area,
          hijos,
        }
      }

      const raices = ordenarPorNombre(
        grupo.filter(
          (area) => area.gerenciaId == null || !idsEnSede.has(area.gerenciaId),
        ),
      ).map((area) => crearNodo(area, new Set()))

      // Cualquier area atrapada en un ciclo no fue visitada: la colgamos como raiz
      // para que no desaparezca del arbol.
      ordenarPorNombre(grupo)
        .filter((area) => !visitados.has(area.id))
        .forEach((area) => raices.push(crearNodo(area, new Set())))

      return {
        clave: `sede-${claveSede}`,
        titulo: grupo[0]?.sedeNombre || "Sin sede asignada",
        descripcion: "Areas de esta sede",
        etiqueta: "Sede",
        hijos: raices,
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
  return construirJerarquiaContratos(datos)
}

// Tipos cuyo arbol cuelga de la ubicacion: se sirven con el endpoint especifico
// /ubicaciones/jerarquia en una sola llamada, en vez de listar el tipo plano y
// agrupar en el navegador (que truncaba a la primera pagina).
export type TipoDesdeJerarquia = "SEDE" | "AREA"

export function esTipoDesdeJerarquia(tipo: TipoListado): tipo is TipoDesdeJerarquia {
  return tipo === "SEDE" || tipo === "AREA"
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
  // Evita filas repetidas en el arbol plano. El area es un catalogo GLOBAL que
  // puede estar habilitada en varias sedes: para AREA la clave incluye la sede,
  // de modo que la misma area aparezca una vez por cada sede que la habilita.
  const vistos = new Set<string>()
  const agregar = (registro: ConfiguracionGeneralResponse, clave: string) => {
    if (vistos.has(clave)) return
    vistos.add(clave)
    salida.push(registro)
  }

  for (const ubicacion of ubicaciones) {
    const sedes = ubicacion.sedes ?? []

    if (tipo === "SEDE") {
      for (const sede of sedes) {
        agregar(
          {
            ...sede,
            tipoDatoMaestro: sede.tipoDatoMaestro ?? "SEDE",
            ubicacionId: sede.ubicacionId ?? ubicacion.id,
            ubicacionNombre: sede.ubicacionNombre ?? ubicacion.nombre,
          },
          `sede-${sede.id}`,
        )
      }
      continue
    }

    if (tipo === "AREA") {
      for (const sede of sedes) {
        for (const area of sede.areas ?? []) {
          agregar(
            {
              ...area,
              tipoDatoMaestro: area.tipoDatoMaestro ?? "AREA",
              sedeId: area.sedeId ?? sede.id,
              sedeNombre: area.sedeNombre ?? sede.nombre,
            },
            `area-${sede.id}-${area.id}`,
          )
        }
      }
      continue
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
      // El padre puede ser cualquier area (gerenciaId), no solo cuando el nivel es
      // AREA: la jerarquia es recursiva. Si no tiene padre, es raiz de la sede.
      if (dato.gerenciaNombre) partes.push(`Depende de: ${dato.gerenciaNombre}`)
      return partes.length > 0 ? partes.join(" · ") : null
    }
    case "CARGO": {
      const partes: string[] = []
      // El cargo pertenece a un area (de una sede concreta). El mando puede cruzar
      // areas/sedes, asi que se muestran por separado: donde trabaja y a quien
      // reporta. Si no tiene superior, es un cargo raiz (nivel mas alto).
      if (dato.areaNombre) partes.push(`Area: ${dato.areaNombre}`)
      if (dato.cargoSuperiorNombre) partes.push(`Reporta a: ${dato.cargoSuperiorNombre}`)
      return partes.length > 0 ? partes.join(" · ") : null
    }
    case "CONTRATO":
      return dato.contratoPadreNombre ? `Pertenece a: ${dato.contratoPadreNombre}` : null
    default:
      return null
  }
}
