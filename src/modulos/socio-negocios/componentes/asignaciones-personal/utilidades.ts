// Helpers puros, tipos locales y constantes del formulario de asignacion de
// personal. Se extrajeron de asignaciones-personal-seccion.tsx para reducir el
// tamano del componente y poder reutilizarlos entre las piezas del formulario.

import { ApiError } from "@/compartido/api/axios"

import type {
  AprobadorCuentaContratoRequest,
  AsignacionPersonalResponse,
  ConfiguracionGeneralOpcionResponse,
  CuentaContrato,
  TipoAsignacionCuentaContrato,
} from "../../tipos/asignacion-personal"
import type { PersonalListadoResponse } from "../../tipos/socio-negocio"

export type CampoOrganizacion = {
  key: "cargoId" | "sedeId" | "areaId"
  label: string
}

export type ValoresOrganizacion = Record<CampoOrganizacion["key"], string>

export type OpcionCatalogo = {
  id: string
  codigo: string
  nombre: string
}

// La vigencia de cada cuenta/contrato es la misma de la asignacion (heredada al
// guardar), por eso la fila ya no lleva fechas propias: evita que queden fuera
// del rango de la asignacion.
//
// Cada fila es de un tipo:
// - "CUENTA": se elige una cuenta (obligatoria) y, opcionalmente, un contrato
//   hijo de esa cuenta.
// - "CONTRATO": se elige primero una cuenta y luego un contrato obligatorio de
//   esa cuenta. El backend soporta ambos detalles; aqui se valida la relacion.
export type RelacionCuentaContratoFila = {
  key: string
  tipo: TipoAsignacionCuentaContrato
  cuenta: OpcionCatalogo | null
  contrato: OpcionCatalogo | null
}

// Aprobador (firma) capturado manualmente. El orden en la lista define el
// `ordenAprobacion` y se aplica igual a todas las cuentas/contratos.
export type AprobadorFila = {
  key: string
  aprobadorCodigo: string
  aprobadorNombre: string
}

export const VALORES_ORGANIZACION_VACIOS: ValoresOrganizacion = {
  cargoId: "",
  sedeId: "",
  areaId: "",
}

// Catalogos de Configuracion General usados por el formulario, cargados una sola
// vez en el contenedor (ver AsignacionFormulario) desde el endpoint
// opciones-formulario y compartidos por los selects.
export type CatalogosOrganizacion = {
  cargos: ConfiguracionGeneralOpcionResponse[]
  sedes: ConfiguracionGeneralOpcionResponse[]
  areas: ConfiguracionGeneralOpcionResponse[]
}

export const PASOS_ASIGNACION = [
  { id: "datos", titulo: "Cargo y vigencia" },
  { id: "cuentas", titulo: "Cuenta y contrato" },
  { id: "laboral", titulo: "Horario de trabajo" },
  { id: "aprobadores", titulo: "Quien aprueba" },
  { id: "confirmacion", titulo: "Confirmacion" },
] as const

/**
 * Al editar, la asignacion trae codigos y nombres (cargo/sede/area). Aqui los
 * cruzamos contra el catalogo plano para dejar los selectores ya seleccionados
 * con su valor actual. Se prioriza el match por `codigo` (estable) y, si no
 * calza, por `nombre`. Si nada calza, ese campo queda vacio (se conserva el
 * actual al no tocarlo).
 */
export function mapearOrganizacionInicial(
  asignacion: AsignacionPersonalResponse,
  catalogos: CatalogosOrganizacion,
): ValoresOrganizacion {
  const norm = (texto?: string) => (texto ?? "").trim().toLocaleLowerCase("es")
  const buscar = (
    lista: ConfiguracionGeneralOpcionResponse[],
    codigo?: string,
    nombre?: string,
  ) =>
    (codigo ? lista.find((item) => norm(item.codigo) === norm(codigo)) : undefined) ??
    (nombre ? lista.find((item) => norm(item.nombre) === norm(nombre)) : undefined)

  const cargo = buscar(catalogos.cargos, asignacion.cargoCodigo, asignacion.cargoNombre)
  const sede = buscar(catalogos.sedes, asignacion.sedeCodigo, asignacion.sedeNombre)
  const area = buscar(catalogos.areas, asignacion.areaCodigo, asignacion.areaNombre)

  return {
    cargoId: cargo ? String(cargo.id) : "",
    sedeId: sede ? String(sede.id) : "",
    areaId: area ? String(area.id) : "",
  }
}

export function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) {
    const mensajesValidacion = error.errores
      ?.map((item) => item.mensaje)
      .filter(Boolean)

    if (mensajesValidacion?.length) {
      return mensajesValidacion.join(" ")
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "No se pudo completar la operacion."
}

export function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(valor)
}

export function soloFecha(fecha?: string | null) {
  if (!fecha) return ""
  return String(fecha).slice(0, 10)
}

export function fechaApi(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`).toISOString()
}

export function obtenerEtiquetaCatalogo(item: ConfiguracionGeneralOpcionResponse) {
  return `${item.codigo} - ${item.nombre}`
}

export function obtenerNombrePersonal(personal: PersonalListadoResponse) {
  return (
    personal.nombreCompleto ||
    [
      personal.primerNombre,
      personal.segundoNombre,
      personal.apellidoPaterno,
      personal.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(" ") ||
    personal.numeroDocumento ||
    "Personal sin identificar"
  )
}

export function obtenerEtiquetaPersonal(personal: PersonalListadoResponse) {
  const nombre = obtenerNombrePersonal(personal)
  return personal.numeroDocumento ? `${nombre} - ${personal.numeroDocumento}` : nombre
}

export function obtenerAsignacionVigentePersonal(personal: PersonalListadoResponse) {
  return personal.asignaciones?.find((item) => item.estado === "VIGENTE") ?? null
}

export function obtenerCargoSuperiorSeleccionado(
  cargos: ConfiguracionGeneralOpcionResponse[],
  cargoId?: string,
) {
  const cargoSeleccionado = cargos.find((item) => String(item.id) === String(cargoId ?? ""))
  if (!cargoSeleccionado?.cargoSuperiorId) return null
  return cargos.find((item) => String(item.id) === String(cargoSeleccionado.cargoSuperiorId)) ?? null
}

export function obtenerCargosSuperiores(
  cargos: ConfiguracionGeneralOpcionResponse[],
  cargoId?: string,
) {
  const resultado: ConfiguracionGeneralOpcionResponse[] = []
  const visitados = new Set<string>()
  let actual = cargos.find((item) => String(item.id) === String(cargoId ?? ""))

  while (actual?.cargoSuperiorId != null) {
    const superiorId = String(actual.cargoSuperiorId)
    if (visitados.has(superiorId)) break
    visitados.add(superiorId)
    const superior = cargos.find((item) => String(item.id) === superiorId)
    if (!superior) break
    resultado.push(superior)
    actual = superior
  }

  return resultado
}

export function obtenerCandidatosJefe(
  personalCatalogo: PersonalListadoResponse[],
  areasCatalogo: ConfiguracionGeneralOpcionResponse[],
  cargosCatalogo: ConfiguracionGeneralOpcionResponse[],
  areaId?: string,
  cargoId?: string,
) {
  const areaSeleccionada = areasCatalogo.find((item) => String(item.id) === String(areaId ?? ""))
  // Cadena de areas objetivo: la propia area + todos sus ancestros por gerenciaId,
  // ordenada del mas cercano al mas lejano. Asi el jefe se resuelve al responsable
  // mas proximo hacia arriba y, si no hay, sube hasta la gerencia raiz (Gerente
  // General). Se corta ante ciclos con el set de ids ya vistos.
  const cadenaAreas: string[] = []
  if (areaSeleccionada) {
    const vistos = new Set<string>()
    let actual: ConfiguracionGeneralOpcionResponse | undefined = areaSeleccionada
    while (actual && !vistos.has(String(actual.id))) {
      vistos.add(String(actual.id))
      if (actual.codigo) cadenaAreas.push(actual.codigo)
      const padreId: string | undefined = actual.gerenciaId
      actual = padreId
        ? areasCatalogo.find((item) => String(item.id) === String(padreId))
        : undefined
    }
  }
  const rangoArea = new Map(cadenaAreas.map((codigo, indice) => [codigo, indice]))

  const candidatosArea = personalCatalogo
    .map((personal) => ({
      personal,
      asignacion: obtenerAsignacionVigentePersonal(personal),
    }))
    .filter(({ asignacion }) => Boolean(asignacion))
    .filter(({ asignacion }) => rangoArea.has(asignacion?.areaCodigo ?? ""))
    .map(({ personal, asignacion }) => ({ personal, asignacion: asignacion! }))
    // Mas cercano hacia arriba primero: el primero es el jefe sugerido por defecto.
    .sort(
      (a, b) =>
        (rangoArea.get(a.asignacion.areaCodigo ?? "") ?? Number.MAX_SAFE_INTEGER) -
        (rangoArea.get(b.asignacion.areaCodigo ?? "") ?? Number.MAX_SAFE_INTEGER),
    )

  if (candidatosArea.length > 0) return candidatosArea

  const cargosObjetivo = obtenerCargosSuperiores(cargosCatalogo, cargoId).map((item) => item.codigo)

  return personalCatalogo
    .map((personal) => ({
      personal,
      asignacion: obtenerAsignacionVigentePersonal(personal),
    }))
    .filter(({ asignacion }) => Boolean(asignacion))
    .filter(({ asignacion }) => cargosObjetivo.includes(asignacion?.cargoCodigo ?? ""))
    .map(({ personal, asignacion }) => ({ personal, asignacion: asignacion! }))
}

export function aOpcionCatalogo(item: ConfiguracionGeneralOpcionResponse): OpcionCatalogo {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
  }
}

/**
 * Opcion de contrato con sangria por nivel jerarquico para que el combo deje ver
 * la profundidad (cuenta=1, contrato directo=2, subniveles 3, 4...).
 */
export function aOpcionContrato(item: ConfiguracionGeneralOpcionResponse): OpcionCatalogo {
  const nivel = item.nivelCuentaContrato ?? 2
  const sangria = nivel > 2 ? `${"· ".repeat(nivel - 2)}` : ""
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: `${sangria}${item.nombre}`,
  }
}

/**
 * Indica si un contrato cuelga (directa o indirectamente, por subniveles) de la
 * cuenta indicada. Recorre la cadena `contratoPadreId` hasta toparse con la
 * cuenta (que no esta en el catalogo de contratos) o con un ciclo.
 */
export function contratoPerteneceACuenta(
  contrato: ConfiguracionGeneralOpcionResponse,
  cuentaId: string,
  contratosPorId: Map<string, ConfiguracionGeneralOpcionResponse>,
): boolean {
  let actual: ConfiguracionGeneralOpcionResponse | undefined = contrato
  const visitados = new Set<string>()
  while (actual) {
    const padreId = String(actual.contratoPadreId ?? "")
    if (!padreId) return false
    if (padreId === cuentaId) return true
    if (visitados.has(padreId)) return false
    visitados.add(padreId)
    actual = contratosPorId.get(padreId)
  }
  return false
}

export function aOpcionCuentaContratoExistente(
  item: AsignacionPersonalResponse["cuentasContratos"][number],
  catalogo: ConfiguracionGeneralOpcionResponse[],
): OpcionCatalogo {
  const configuracionActual = buscarConfiguracionActual(item, catalogo)
  if (configuracionActual) return aOpcionCatalogo(configuracionActual)

  return {
    id: String(item.configuracionId ?? item.configuracionCodigo),
    codigo: item.configuracionCodigo,
    nombre: item.configuracionNombre,
  }
}

export function buscarConfiguracionActual(
  item: AsignacionPersonalResponse["cuentasContratos"][number],
  catalogo: ConfiguracionGeneralOpcionResponse[],
) {
  return (
    catalogo.find((opcion) => opcion.codigo === item.configuracionCodigo) ??
    catalogo.find(
      (opcion) =>
        opcion.nombre.trim().toLocaleLowerCase("es") ===
        item.configuracionNombre.trim().toLocaleLowerCase("es"),
    ) ??
    null
  )
}

export function agregarOpcionActual(
  opciones: OpcionCatalogo[],
  actual: OpcionCatalogo | null,
) {
  if (!actual || opciones.some((item) => item.id === actual.id)) return opciones
  return [actual, ...opciones]
}

let contadorFilas = 0
export function nuevaClaveFila() {
  contadorFilas += 1
  return `relacion-${contadorFilas}`
}

export function crearFilaCuentaVacia(): RelacionCuentaContratoFila {
  return {
    key: nuevaClaveFila(),
    tipo: "CUENTA",
    cuenta: null,
    contrato: null,
  }
}

export function crearFilaContratoVacia(): RelacionCuentaContratoFila {
  return {
    key: nuevaClaveFila(),
    tipo: "CONTRATO",
    cuenta: null,
    contrato: null,
  }
}

export function crearFilaAprobadorVacia(): AprobadorFila {
  return {
    key: nuevaClaveFila(),
    aprobadorCodigo: "",
    aprobadorNombre: "",
  }
}

/**
 * Aprobadores iniciales al editar: se reconstruyen desde las firmas existentes
 * de los detalles vigentes (la primera relacion que las tenga), ordenadas por
 * `ordenAprobacion`, para no perderlas al reemplazar las cuentas/contratos.
 */
export function crearFilasAprobadorActual(
  asignacion: AsignacionPersonalResponse,
): AprobadorFila[] {
  const conFirmas = asignacion.cuentasContratos
    .filter((item) => item.estado !== "ANULADA" && (item.aprobaciones?.length ?? 0) > 0)
    .map((item) => item.aprobaciones ?? [])
    .sort((a, b) => b.length - a.length)[0]

  if (!conFirmas?.length) return []

  return [...conFirmas]
    .sort((a, b) => a.ordenAprobacion - b.ordenAprobacion)
    .map((firma) => ({
      key: nuevaClaveFila(),
      aprobadorCodigo: firma.aprobadorCodigo ?? "",
      aprobadorNombre: firma.aprobadorNombre ?? "",
    }))
}

export function firmaAprobadores(filas: AprobadorFila[]) {
  return filas
    .map((fila) => `${fila.aprobadorCodigo.trim()}:${fila.aprobadorNombre.trim()}`)
    .join("|")
}

/** Filas con codigo y nombre completos, listas para enviar al backend. */
export function aprobadoresValidos(
  filas: AprobadorFila[],
): AprobadorCuentaContratoRequest[] {
  return filas
    .map((fila) => {
      const aprobadorCodigo = fila.aprobadorCodigo.trim()
      const aprobadorNombre = fila.aprobadorNombre.trim()
      return {
        aprobadorCodigo,
        aprobadorNombre: aprobadorNombre || aprobadorCodigo,
      }
    })
    .filter((fila) => fila.aprobadorCodigo && fila.aprobadorNombre)
}

export function crearFilasRelacionActual(
  asignacion: AsignacionPersonalResponse,
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[],
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[],
  // Al reutilizar la configuracion de una asignacion previa (posiblemente
  // finalizada) tomamos sus cuentas/contratos no anulados; en edicion normal
  // solo las vigentes.
  incluirNoVigentes = false,
): RelacionCuentaContratoFila[] {
  const relacionesVigentes = asignacion.cuentasContratos.filter((item) =>
    incluirNoVigentes ? item.estado !== "ANULADA" : item.estado === "VIGENTE",
  )
  const filas: RelacionCuentaContratoFila[] = []

  // Cada detalle guardado se reconstruye como su propio bloque, rotulado por tipo.
  relacionesVigentes
    .filter((item) => item.tipo === "CUENTA")
    .forEach((cuenta) => {
      filas.push({
        key: nuevaClaveFila(),
        tipo: "CUENTA",
        cuenta: aOpcionCuentaContratoExistente(cuenta, cuentasCatalogo),
        contrato: null,
      })
    })

  relacionesVigentes
    .filter((item) => item.tipo === "CONTRATO")
    .forEach((contrato) => {
      filas.push({
        key: nuevaClaveFila(),
        tipo: "CONTRATO",
        cuenta: null,
        contrato: aOpcionCuentaContratoExistente(contrato, contratosCatalogo),
      })
    })

  return filas
}

export function firmaRelaciones(filas: RelacionCuentaContratoFila[]) {
  return filas
    .map((fila) => `${fila.tipo}:${fila.cuenta?.id ?? ""}:${fila.contrato?.id ?? ""}`)
    .sort()
    .join("|")
}

export function nombreOpcionSeleccionada(
  id: string,
  catalogo: ConfiguracionGeneralOpcionResponse[],
  respaldo?: string,
) {
  const item = catalogo.find((opcion) => String(opcion.id) === id)
  return item ? `${item.codigo} - ${item.nombre}` : respaldo || "Sin definir"
}

export type ResultadoRelacionContractual =
  | { ok: false; error: string }
  | { ok: true; cuentasContratos: CuentaContrato[] }

export function validarYConstruirCuentasContratos(
  filas: RelacionCuentaContratoFila[],
  vigencia: { vigenteDesde: string; vigenteHasta: string },
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[],
  // Misma lista de firmas para todas las cuentas/contratos. Se omite el campo si
  // esta vacia para no enviar `aprobadores: []`.
  aprobadores: AprobadorCuentaContratoRequest[] = [],
): ResultadoRelacionContractual {
  if (filas.length === 0) {
    return {
      ok: false,
      error: "Agrega al menos una cuenta o un contrato.",
    }
  }

  // Cada tipo de bloque solo exige su propio dato:
  // - CUENTA: la cuenta es obligatoria; el contrato hijo es opcional.
  // - CONTRATO: solo el contrato es obligatorio. No requiere cuenta: el backend
  //   resuelve la jerarquia (cuenta raiz) a partir del contrato.
  const cuentaSinSeleccion = filas.find((fila) => fila.tipo === "CUENTA" && !fila.cuenta)
  if (cuentaSinSeleccion) {
    return {
      ok: false,
      error: "El bloque de cuenta debe tener una cuenta seleccionada.",
    }
  }

  const contratoSinSeleccion = filas.find(
    (fila) => fila.tipo === "CONTRATO" && !fila.contrato,
  )
  if (contratoSinSeleccion) {
    return {
      ok: false,
      error: "El bloque de contrato debe tener un contrato seleccionado.",
    }
  }

  // La misma cuenta puede aparecer en varios bloques (se deduplica al enviar).
  // Lo que no se permite es repetir el mismo contrato.
  const contratos = filas
    .map((fila) => fila.contrato?.id)
    .filter((contrato): contrato is string => Boolean(contrato))
  if (new Set(contratos).size !== contratos.length) {
    return {
      ok: false,
      error: "No puedes repetir el mismo contrato en dos bloques distintos.",
    }
  }

  // Solo en bloques CUENTA con contrato hijo validamos que el contrato pertenezca
  // a esa cuenta (relacion explicita del front). En bloques CONTRATO sueltos no
  // se valida cuenta: la jerarquia la resuelve el backend.
  const contratoInvalido = filas.find((fila) => {
    if (fila.tipo !== "CUENTA" || !fila.cuenta || !fila.contrato) return false
    const contrato = contratosCatalogo.find((item) => String(item.id) === fila.contrato?.id)
    if (!contrato) return false
    return String(contrato?.contratoPadreId ?? "") !== fila.cuenta.id
  })
  if (contratoInvalido) {
    return {
      ok: false,
      error: "El contrato seleccionado no pertenece a la cuenta elegida.",
    }
  }

  // La vigencia de cada cuenta/contrato se hereda de la asignacion: asi siempre
  // queda dentro de su rango y no puede dispararse el error de vigencia.
  const vigenteDesde = fechaApi(vigencia.vigenteDesde)
  const vigenteHasta = vigencia.vigenteHasta ? fechaApi(vigencia.vigenteHasta) : undefined

  const firmas = aprobadores.length > 0 ? { aprobadores } : {}
  const cuentasContratos: CuentaContrato[] = []
  // Evita enviar la misma CUENTA o el mismo CONTRATO dos veces.
  const cuentasEmitidas = new Set<string>()
  const contratosEmitidos = new Set<string>()

  function emitirCuenta(cuentaId: string) {
    if (cuentasEmitidas.has(cuentaId)) return
    cuentasEmitidas.add(cuentaId)
    cuentasContratos.push({
      tipo: "CUENTA",
      configuracionId: cuentaId,
      vigenteDesde,
      vigenteHasta,
      orden: cuentasContratos.length,
      ...firmas,
    })
  }

  function emitirContrato(contratoId: string) {
    if (contratosEmitidos.has(contratoId)) return
    contratosEmitidos.add(contratoId)
    cuentasContratos.push({
      tipo: "CONTRATO",
      configuracionId: contratoId,
      vigenteDesde,
      vigenteHasta,
      orden: cuentasContratos.length,
      ...firmas,
    })
  }

  filas.forEach((fila) => {
    if (fila.tipo === "CUENTA" && fila.cuenta) {
      emitirCuenta(fila.cuenta.id)
      if (fila.contrato) emitirContrato(fila.contrato.id)
    } else if (fila.tipo === "CONTRATO" && fila.contrato) {
      // Contrato suelto: el backend resuelve su cuenta raiz.
      emitirContrato(fila.contrato.id)
    }
  })

  return { ok: true, cuentasContratos }
}
