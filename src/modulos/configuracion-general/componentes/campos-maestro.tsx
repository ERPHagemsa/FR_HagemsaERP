"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, Loader2, Search } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Input } from "@/compartido/componentes/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/compartido/componentes/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { paisesLatinoamerica } from "@/compartido/datos/ubicaciones"
import {
  buscarDistritos,
  listarDepartamentosGeo,
  listarDistritosGeo,
  listarProvinciasGeo,
  type DistritoGeo,
} from "@/modulos/comercial/ubicaciones/servicios/geo-api"
import { SelectorUbicacionMapa } from "@/modulos/comercial/ubicaciones/componentes/selector-ubicacion-mapa"
import type { DatosUbicacionGeo } from "@/modulos/comercial/ubicaciones/tipos/ubicaciones.tipos"

import type {
  ConfiguracionGeneralResponse,
  ModificarRequestPorTipo,
  NivelArea,
  RegistrarRequestPorTipo,
  TipoDatoMaestro,
  TipoUbicacion,
} from "../tipos/configuracion-general"

// ---------------------------------------------------------------------------
// Campos especificos por tipo de dato maestro.
//
// Este modulo concentra los inputs propios de cada maestro (ubicacion, sede,
// area, almacen, cuenta, contrato, cargo) y los helpers de ubigeo. Lo usan TANTO
// el formulario de registro como el dialogo de edicion, de modo que editar un
// maestro respeta su jerarquia igual que crearlo. Los `name` de cada campo
// coinciden con lo que leen los constructores de payload mas abajo.
// ---------------------------------------------------------------------------

export type OpcionUbicacion = {
  codigo: string
  descripcion?: string
  nombre: string
  departamento?: string
  provincia?: string
  distrito?: string
  codigoDepartamento?: string
  codigoProvincia?: string
  codigoDistrito?: string
  ubigeo?: string
}

/** Catalogos activos que alimentan los selectores de dependencias. */
export interface CatalogosMaestro {
  areas: ConfiguracionGeneralResponse[]
  cargos: ConfiguracionGeneralResponse[]
  contratos: ConfiguracionGeneralResponse[]
  cuentas: ConfiguracionGeneralResponse[]
  sedes: ConfiguracionGeneralResponse[]
  ubicaciones: ConfiguracionGeneralResponse[]
}

export interface RelacionVistaPreviaMaestro {
  area?: ConfiguracionGeneralResponse
  cargoSuperior?: ConfiguracionGeneralResponse
  contratoPadre?: ConfiguracionGeneralResponse
  esTemporal?: boolean
  gerencia?: ConfiguracionGeneralResponse
  nivelArea?: NivelArea
  sede?: ConfiguracionGeneralResponse
  ubicacion?: ConfiguracionGeneralResponse
}

export const tiposUbicacion: Array<{ value: TipoUbicacion; label: string }> = [
  { value: "SEDE", label: "Sede" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "PLANTA", label: "Planta" },
  { value: "MINA", label: "Mina" },
  { value: "PUERTO", label: "Puerto" },
  { value: "PEAJE", label: "Peaje" },
  { value: "ESTACIONAMIENTO", label: "Estacionamiento" },
  { value: "ALMACEN", label: "Almacen" },
  { value: "PATIO", label: "Patio" },
  { value: "TERMINAL", label: "Terminal" },
  { value: "OTRO", label: "Otro" },
]

function normalizarBusquedaUbigeo(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

function obtenerPais(codigoPais: string) {
  return paisesLatinoamerica.find((pais) => pais.codigo === codigoPais) ?? paisesLatinoamerica[0]
}

/** Resuelve el codigo de pais a partir de un valor guardado (codigo o nombre). */
function resolverCodigoPais(valor?: string | null) {
  if (!valor) return "PE"
  const normalizado = valor.trim().toUpperCase()
  const encontrado = paisesLatinoamerica.find(
    (pais) =>
      pais.codigo.toUpperCase() === normalizado ||
      pais.nombre.toUpperCase() === normalizado,
  )
  return encontrado?.codigo ?? "PE"
}

function obtenerDepartamentos(codigoPais: string): OpcionUbicacion[] {
  return obtenerPais(codigoPais).departamentos.map((departamento) => ({
    codigo: departamento.codigo,
    nombre: departamento.nombre,
  }))
}

function obtenerProvincias(codigoPais: string, departamento: string): OpcionUbicacion[] {
  if (!departamento) return []

  const departamentoSeleccionado = obtenerPais(codigoPais).departamentos.find(
    (item) => item.nombre === departamento,
  )

  return departamentoSeleccionado?.provincias.map((provincia) => ({
    codigo: provincia.codigo,
    nombre: provincia.nombre,
  })) ?? []
}

function obtenerDistritos(
  codigoPais: string,
  departamento: string,
  provincia: string,
): OpcionUbicacion[] {
  if (!departamento || !provincia) return []

  const departamentoSeleccionado = obtenerPais(codigoPais).departamentos.find(
    (item) => item.nombre === departamento,
  )
  const provinciaSeleccionada = departamentoSeleccionado?.provincias.find(
    (item) => item.nombre === provincia,
  )

  return provinciaSeleccionada?.distritos.map((distrito) => ({
    codigo: distrito.codigo,
    nombre: distrito.nombre,
  })) ?? []
}

/**
 * Typeahead de distrito contra geo-peru-api (`GET /distritos/buscar`). Busca
 * con debounce mientras el usuario escribe (min 2 letras) y al elegir un
 * resultado llena departamento/provincia/distrito + sus codigos INEI de una
 * sola vez, reemplazando la cascada de 3 selects para Peru.
 */
function DistritoGeoAutocomplete({
  onSeleccionar,
  valorInicial,
}: {
  onSeleccionar: (distrito: DistritoGeo) => void
  valorInicial?: string
}) {
  const [busqueda, setBusqueda] = useState(valorInicial ?? "")
  const [resultados, setResultados] = useState<DistritoGeo[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)
  const secuencia = useRef(0)

  useEffect(() => {
    const idIntento = ++secuencia.current
    const termino = busqueda.trim()
    const temporizador = setTimeout(() => {
      if (secuencia.current !== idIntento) return
      if (termino.length < 2) {
        setResultados([])
        setCargando(false)
        return
      }
      setCargando(true)
      setError(null)
      buscarDistritos(termino, 8)
        .then((data) => {
          if (secuencia.current !== idIntento) return
          setResultados(data)
        })
        .catch(() => {
          if (secuencia.current !== idIntento) return
          setError("No se pudo buscar el distrito. Intenta de nuevo.")
        })
        .finally(() => {
          if (secuencia.current !== idIntento) return
          setCargando(false)
        })
    }, 300)
    return () => clearTimeout(temporizador)
  }, [busqueda])

  function seleccionar(distrito: DistritoGeo) {
    setBusqueda(`${distrito.distrito}, ${distrito.provincia}, ${distrito.departamento}`)
    setAbierto(false)
    setResultados([])
    onSeleccionar(distrito)
  }

  return (
    <div className="relative grid gap-2">
      <label className="text-sm font-medium" htmlFor="distrito-geo-busqueda">
        Buscador de distrito (opcional)
      </label>
      <InputGroup>
        <InputGroupAddon>
          {cargando ? <Loader2 className="animate-spin" /> : <Search />}
        </InputGroupAddon>
        <InputGroupInput
          id="distrito-geo-busqueda"
          value={busqueda}
          placeholder="Escribe el nombre del distrito, ej. Cerro Colorado"
          onChange={(event) => {
            setBusqueda(event.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
      </InputGroup>
      <p className="text-xs text-muted-foreground">
        Escribe al menos 2 letras. Resultados desde geo-peru-api con departamento, provincia, distrito y ubigeo.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {abierto && (resultados.length > 0 || (cargando && busqueda.trim().length >= 2)) ? (
        <div className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-background shadow-md">
          {resultados.length === 0 && cargando ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
        ) : (
            resultados.map((distrito) => (
              <button
                key={distrito.ubigeo}
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => seleccionar(distrito)}
              >
                <span className="font-medium">{distrito.distrito}</span>
                <span className="text-xs text-muted-foreground">
                  {distrito.provincia}, {distrito.departamento} · Ubigeo {distrito.ubigeo}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function SelectorMaestroBuscable({
  defaultValue = "",
  datos,
  emptyText,
  label,
  name,
  onValueChange,
  placeholder,
  required,
}: {
  defaultValue?: string
  datos: ConfiguracionGeneralResponse[]
  emptyText: string
  label: string
  name: string
  onValueChange?: (value: string) => void
  placeholder: string
  required?: boolean
}) {
  const [busqueda, setBusqueda] = useState("")
  const [seleccionado, setSeleccionado] = useState(defaultValue)
  const seleccion = datos.find((dato) => String(dato.id) === seleccionado)
  const datosFiltrados = datos.filter((dato) => {
    const texto = `${dato.codigo} ${dato.nombre}`.toLowerCase()
    return texto.includes(busqueda.trim().toLowerCase())
  })

  function seleccionar(id: string) {
    setSeleccionado(id)
    onValueChange?.(id)
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={`${name}-busqueda`}>{label}</label>
      <input name={name} value={seleccionado} required={required} readOnly hidden />
      <Input
        id={`${name}-busqueda`}
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        placeholder={
          seleccion
            ? `${seleccion.codigo} - ${seleccion.nombre}`
            : placeholder
        }
      />
      <div className="max-h-48 overflow-auto rounded-md border border-border bg-background">
        {datosFiltrados.length > 0 ? (
          datosFiltrados.map((dato) => {
            const activo = String(dato.id) === seleccionado

            return (
              <button
                key={dato.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => seleccionar(String(dato.id))}
              >
                <span className="min-w-0 truncate">
                  {dato.codigo} - {dato.nombre}
                </span>
                {activo ? <Badge variant="secondary">Seleccionado</Badge> : null}
              </button>
            )
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
        )}
      </div>
    </div>
  )
}

function SelectorUbicacionBuscable({
  disabled,
  emptyText,
  label,
  name,
  onValueChange,
  opciones,
  optionValue = "nombre",
  placeholder,
  searchPlaceholder,
  submitValue,
  value,
}: {
  disabled?: boolean
  emptyText: string
  label: string
  name: string
  onValueChange: (value: string) => void
  opciones: OpcionUbicacion[]
  optionValue?: "codigo" | "nombre"
  placeholder: string
  searchPlaceholder: string
  submitValue?: string
  value: string
}) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const busquedaNormalizada = normalizarBusquedaUbigeo(busqueda)
  const seleccion = opciones.find((opcion) => opcion.nombre === value || opcion.codigo === value)
  const opcionesFiltradas = opciones.filter((opcion) => {
    const texto = normalizarBusquedaUbigeo(`${opcion.codigo} ${opcion.nombre} ${opcion.descripcion ?? ""}`)

    return texto.includes(busquedaNormalizada)
  })

  function seleccionar(opcion: OpcionUbicacion) {
    onValueChange(opcion[optionValue])
    setBusqueda("")
    setOpen(false)
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={`${name}-selector`}>{label}</label>
      <input name={name} value={submitValue ?? value} required readOnly hidden />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`${name}-selector`}
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="min-w-0 truncate text-left">
              {seleccion?.nombre ?? (value || placeholder)}
            </span>
            <Search data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) gap-3 p-3">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={busqueda}
              placeholder={searchPlaceholder}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </InputGroup>
          <div className="max-h-64 overflow-auto rounded-md border border-border bg-background">
            {opcionesFiltradas.length > 0 ? (
              opcionesFiltradas.map((opcion) => {
                const activo = seleccion?.codigo === opcion.codigo

                return (
                  <button
                    key={`${opcion.codigo}-${opcion.nombre}`}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => seleccionar(opcion)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{opcion.nombre}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {opcion.descripcion ?? opcion.codigo}
                      </span>
                    </span>
                    {activo ? <CheckCircle2 data-icon="inline-end" /> : null}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Renderiza los campos propios del `tipo`. En modo edicion recibe
 * `valoresIniciales` para precargarlos. Los `name` coinciden con lo que leen
 * `construirPayloadRegistro` / `construirPayloadModificacion`.
 */
export function CamposMaestro({
  tipo,
  catalogos,
  valoresIniciales,
  esEdicion = false,
  onRelacionChange,
  seccion = "todos",
}: {
  tipo: TipoDatoMaestro
  catalogos: CatalogosMaestro
  valoresIniciales?: ConfiguracionGeneralResponse
  esEdicion?: boolean
  onRelacionChange?: (cambios: Partial<RelacionVistaPreviaMaestro>) => void
  seccion?: "detalle" | "relacion" | "todos"
}) {
  const { areas, cargos, contratos, cuentas, sedes, ubicaciones } = catalogos
  const [nivelArea, setNivelArea] = useState<NivelArea>(valoresIniciales?.nivelArea ?? "AREA")
  // CARGO: area elegida (filtra los posibles cargos superiores) y cargo superior
  // en curso (para la etiqueta raiz/dependiente en vivo y la ayuda textual).
  const [cargoAreaId, setCargoAreaId] = useState(
    valoresIniciales?.areaId != null ? String(valoresIniciales.areaId) : "",
  )
  const [cargoSuperiorId, setCargoSuperiorId] = useState(
    valoresIniciales?.cargoSuperiorId != null
      ? String(valoresIniciales.cargoSuperiorId)
      : "__none",
  )
  // Padres posibles de un area: cualquier area del catalogo global, excepto la
  // propia y sus descendientes (elegir un descendiente como padre crearia un
  // ciclo). gerenciaId apunta a otra Area; la jerarquia es recursiva, asi que no
  // se limita a nivelArea === "GERENCIA".
  const idAreaEditada = valoresIniciales?.id
  const descendientesArea = useMemo(() => {
    const descendientes = new Set<number>()
    if (idAreaEditada == null) return descendientes
    const cola = [idAreaEditada]
    while (cola.length > 0) {
      const actual = cola.pop() as number
      for (const area of areas) {
        if (area.gerenciaId === actual && !descendientes.has(area.id)) {
          descendientes.add(area.id)
          cola.push(area.id)
        }
      }
    }
    return descendientes
  }, [areas, idAreaEditada])
  const padresDisponibles = areas.filter(
    (area) => area.id !== idAreaEditada && !descendientesArea.has(area.id),
  )

  const [paisUbicacion, setPaisUbicacion] = useState(() =>
    resolverCodigoPais(valoresIniciales?.pais),
  )
  const [departamentoUbigeo, setDepartamentoUbigeo] = useState(valoresIniciales?.departamento ?? "")
  const [provinciaUbigeo, setProvinciaUbigeo] = useState(valoresIniciales?.provincia ?? "")
  const [distritoUbigeo, setDistritoUbigeo] = useState(valoresIniciales?.distrito ?? "")
  // Codigos INEI resueltos por geo-peru-api al elegir un distrito del
  // typeahead. Viajan aparte de los nombres (ver DistritoGeoAutocomplete).
  const [codigoDepartamento, setCodigoDepartamento] = useState(
    valoresIniciales?.codigoDepartamento ?? "",
  )
  const [codigoProvincia, setCodigoProvincia] = useState(valoresIniciales?.codigoProvincia ?? "")
  const [codigoDistrito, setCodigoDistrito] = useState(valoresIniciales?.codigoDistrito ?? "")
  const [ubigeo, setUbigeo] = useState(valoresIniciales?.ubigeo ?? "")
  const [geoDepartamentos, setGeoDepartamentos] = useState<OpcionUbicacion[]>([])
  const [geoProvinciasTodas, setGeoProvinciasTodas] = useState<OpcionUbicacion[]>([])
  const [geoDistritosTodos, setGeoDistritosTodos] = useState<OpcionUbicacion[]>([])
  // Coordenadas en un solo campo "lat, long" (formato Google). El backend lo
  // separa y redondea; el frontend solo lo envia como coordenadasGoogle.
  const [coordenadas, setCoordenadas] = useState(() =>
    valoresIniciales?.latitud != null && valoresIniciales?.longitud != null
      ? `${valoresIniciales.latitud}, ${valoresIniciales.longitud}`
      : "",
  )
  // Direccion controlada para que el mapa (Places/pin) la autocomplete.
  const [direccionUbicacion, setDireccionUbicacion] = useState(valoresIniciales?.direccion ?? "")
  const paisSeleccionado = obtenerPais(paisUbicacion)
  const opcionesPaises = useMemo<OpcionUbicacion[]>(
    () => paisesLatinoamerica.map((pais) => ({ codigo: pais.codigo, nombre: pais.nombre })),
    [],
  )
  const opcionesDepartamentos = useMemo(() => obtenerDepartamentos(paisUbicacion), [paisUbicacion])
  const opcionesProvincias = useMemo(
    () => obtenerProvincias(paisUbicacion, departamentoUbigeo),
    [departamentoUbigeo, paisUbicacion],
  )
  const opcionesDistritos = useMemo(
    () => obtenerDistritos(paisUbicacion, departamentoUbigeo, provinciaUbigeo),
    [departamentoUbigeo, paisUbicacion, provinciaUbigeo],
  )
  const opcionesGeoProvincias = useMemo(
    () =>
      geoProvinciasTodas.filter(
        (item) => !departamentoUbigeo || item.departamento === departamentoUbigeo,
      ),
    [departamentoUbigeo, geoProvinciasTodas],
  )
  const opcionesGeoDistritos = useMemo(
    () =>
      geoDistritosTodos.filter(
        (item) =>
          (!departamentoUbigeo || item.departamento === departamentoUbigeo) &&
          (!provinciaUbigeo || item.provincia === provinciaUbigeo),
      ),
    [departamentoUbigeo, geoDistritosTodos, provinciaUbigeo],
  )

  function seleccionarPais(codigoPais: string) {
    setPaisUbicacion(codigoPais)
    setDepartamentoUbigeo("")
    setProvinciaUbigeo("")
    setDistritoUbigeo("")
    setCodigoDepartamento("")
    setCodigoProvincia("")
    setCodigoDistrito("")
    setUbigeo("")
    setCoordenadas("")
    setGeoDepartamentos([])
    setGeoProvinciasTodas([])
    setGeoDistritosTodos([])
  }

  function seleccionarDepartamento(departamento: string) {
    setDepartamentoUbigeo(departamento)
    setProvinciaUbigeo("")
    setDistritoUbigeo("")
    setCoordenadas("")
  }

  function seleccionarProvincia(provincia: string) {
    setProvinciaUbigeo(provincia)
    setDistritoUbigeo("")
    setCoordenadas("")
  }

  function seleccionarDistrito(distrito: string) {
    setDistritoUbigeo(distrito)
    setCoordenadas("")
  }

  function seleccionarDepartamentoGeo(codigoDepartamentoGeo: string) {
    const departamento = geoDepartamentos.find((item) => item.codigo === codigoDepartamentoGeo)
    if (!departamento) return

    setDepartamentoUbigeo(departamento.nombre)
    setCodigoDepartamento(departamento.codigo)
    setProvinciaUbigeo("")
    setCodigoProvincia("")
    setDistritoUbigeo("")
    setCodigoDistrito("")
    setUbigeo("")
    setCoordenadas("")
  }

  function seleccionarProvinciaGeo(codigoProvinciaGeo: string) {
    const provincia = opcionesGeoProvincias.find((item) => item.codigo === codigoProvinciaGeo)
    if (!provincia) return

    setProvinciaUbigeo(provincia.nombre)
    setCodigoProvincia(provincia.codigo)
    setDistritoUbigeo("")
    setCodigoDistrito("")
    setUbigeo("")
    setCoordenadas("")
  }

  function seleccionarDistritoGeoCodigo(codigoDistritoGeo: string) {
    const distrito = opcionesGeoDistritos.find((item) => item.codigo === codigoDistritoGeo)
    if (!distrito) return

    setDistritoUbigeo(distrito.nombre)
    setCodigoDistrito(distrito.codigo.slice(4, 6))
    setUbigeo(distrito.codigo)
    setCoordenadas("")
  }

  // Un click en el typeahead de geo-peru-api llena nombres + codigos INEI de
  // una sola vez (departamento, provincia, distrito, ubigeo). Reemplaza la
  // cascada de 3 selects cuando el pais es Peru.
  function seleccionarDistritoGeo(distrito: DistritoGeo) {
    setDepartamentoUbigeo(distrito.departamento)
    setProvinciaUbigeo(distrito.provincia)
    setDistritoUbigeo(distrito.distrito)
    setCodigoDepartamento(distrito.codigoDepartamento)
    setCodigoProvincia(distrito.codigoProvincia)
    setCodigoDistrito(distrito.codigoDistrito)
    setUbigeo(distrito.ubigeo)
  }

  // El mapa (Places autocomplete + pin arrastrable) resuelve direccion,
  // coordenadas y departamento/provincia/distrito. La geo-api ya trae codigos
  // INEI cuando el punto cae en Peru; si no, se cae a busqueda best-effort por
  // nombre de distrito.
  function alSeleccionarMapa(datos: DatosUbicacionGeo) {
    setDireccionUbicacion(datos.direccion)
    setCoordenadas(`${datos.latitud}, ${datos.longitud}`)
    if (datos.departamento) setDepartamentoUbigeo(datos.departamento)
    if (datos.provincia) setProvinciaUbigeo(datos.provincia)
    if (datos.distrito) setDistritoUbigeo(datos.distrito)

    if (datos.codigoDepartamento && datos.codigoProvincia && datos.codigoDistrito && datos.ubigeo) {
      setCodigoDepartamento(datos.codigoDepartamento)
      setCodigoProvincia(datos.codigoProvincia)
      setCodigoDistrito(datos.codigoDistrito)
      setUbigeo(datos.ubigeo)
      return
    }

    if (datos.distrito) {
      buscarDistritos(datos.distrito, 5)
        .then((resultados) => {
          const match = resultados.find(
            (item) =>
              item.distrito === datos.distrito &&
              item.provincia === datos.provincia &&
              item.departamento === datos.departamento,
          )
          if (!match) return
          setCodigoDepartamento(match.codigoDepartamento)
          setCodigoProvincia(match.codigoProvincia)
          setCodigoDistrito(match.codigoDistrito)
          setUbigeo(match.ubigeo)
        })
        .catch(() => {
          // Silencioso: los codigos INEI quedan vacios, el usuario puede
          // completarlos buscando el distrito a mano en el campo de abajo.
      })
    }
  }

  useEffect(() => {
    if (tipo !== "UBICACION" || paisUbicacion !== "PE") return
    let activo = true
    void Promise.all([
      listarDepartamentosGeo(),
      listarProvinciasGeo(),
      listarDistritosGeo(),
    ])
      .then(([departamentos, provincias, distritos]) => {
        if (!activo) return
        setGeoDepartamentos(departamentos)
        setGeoProvinciasTodas(provincias)
        setGeoDistritosTodos(
          distritos.map((item) => ({
            codigo: item.ubigeo,
            nombre: item.nombre,
            descripcion: `${item.provincia}, ${item.departamento}`,
          })),
        )
      })
      .catch(() => {
        if (!activo) return
        setGeoDepartamentos([])
        setGeoProvinciasTodas([])
        setGeoDistritosTodos([])
      })
    return () => {
      activo = false
    }
  }, [paisUbicacion, tipo])

  if (tipo === "CARGO") {
    if (seccion === "detalle") return null

    const areaCargoSeleccionada = areas.find((area) => String(area.id) === cargoAreaId)
    // La cadena de mando es por CARGO e independiente del area/sede: un cargo
    // puede reportar a cualquier otro (p. ej. el Subgerente de una base reporta al
    // unico Gerente General de otra sede). Solo se excluyen el propio cargo y sus
    // descendientes para no crear ciclos en la jerarquia de mando.
    const idCargoEditado = valoresIniciales?.id
    const descendientesCargo = new Set<number>()
    if (idCargoEditado != null) {
      const cola = [idCargoEditado]
      while (cola.length > 0) {
        const actual = cola.pop() as number
        for (const cargo of cargos) {
          if (cargo.cargoSuperiorId === actual && !descendientesCargo.has(cargo.id)) {
            descendientesCargo.add(cargo.id)
            cola.push(cargo.id)
          }
        }
      }
    }
    const cargosDisponibles = cargos.filter(
      (cargo) => cargo.id !== idCargoEditado && !descendientesCargo.has(cargo.id),
    )
    const superiorSeleccionado =
      cargoSuperiorId === "__none"
        ? undefined
        : cargos.find((cargo) => String(cargo.id) === cargoSuperiorId)

    return (
      <>
        <SelectorMaestroBuscable
          datos={areas}
          defaultValue={cargoAreaId}
          emptyText="No hay areas que coincidan con la busqueda"
          label="Area"
          name="areaId"
          onValueChange={(value) => {
            setCargoAreaId(value)
            // El cargo superior es independiente del area, asi que cambiar el area
            // NO lo modifica: se conserva tal cual estaba.
            onRelacionChange?.({
              area: areas.find((area) => String(area.id) === value),
            })
          }}
          placeholder="Buscar area por codigo o nombre"
          required
        />
        <p className="text-xs text-muted-foreground md:col-span-2">
          {areaCargoSeleccionada
            ? `Este cargo pertenecera al area ${areaCargoSeleccionada.nombre}.`
            : "El area define a que pertenece el cargo. Eligela para habilitar el cargo superior."}
        </p>
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="cargoSuperiorId">Cargo superior (reporta a)</label>
        <Select
          name="cargoSuperiorId"
          value={cargoSuperiorId}
          disabled={!cargoAreaId}
          onValueChange={(value) => {
            setCargoSuperiorId(value)
            onRelacionChange?.({
              cargoSuperior:
                value === "__none"
                  ? undefined
                  : cargos.find((cargo) => String(cargo.id) === value),
            })
          }}
        >
          <SelectTrigger id="cargoSuperiorId" className="w-full">
            <SelectValue placeholder="Selecciona a quien reporta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No reporta a nadie (cargo raiz)</SelectItem>
            {cargosDisponibles.length > 0 ? (
              cargosDisponibles.map((cargo) => (
                <SelectItem key={cargo.id} value={String(cargo.id)}>
                  {cargo.codigo} - {cargo.nombre}
                  {cargo.areaNombre ? ` (${cargo.areaNombre})` : ""}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__sin_cargos" disabled>
                No hay otros cargos disponibles
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={superiorSeleccionado ? "secondary" : "outline"}>
            {superiorSeleccionado ? "Cargo dependiente" : "Cargo raiz"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {!cargoAreaId
              ? "Primero elige un area."
              : superiorSeleccionado
                ? `Reportara a ${superiorSeleccionado.nombre}.`
                : "Sin cargo superior queda como cargo raiz (nivel mas alto)."}
          </p>
        </div>
      </div>
      </>
    )
  }

  if (tipo === "UBICACION") {
    if (seccion === "relacion") return null
    return (
      <div className="grid gap-6 md:col-span-2 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="grid content-start gap-4 rounded-xl border bg-card p-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Datos de ubicacion</p>
            <p className="text-xs text-muted-foreground">
              Usa mapa, buscador o combos. Mapa llena direccion y coordenadas; geo-peru-api llena departamento, provincia, distrito y ubigeo.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="tipoUbicacion">Tipo de ubicacion</label>
            <Select name="tipoUbicacion" defaultValue={valoresIniciales?.tipoUbicacion ?? "SEDE"}>
              <SelectTrigger id="tipoUbicacion" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposUbicacion.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SelectorUbicacionBuscable
            emptyText="No hay paises que coincidan con la busqueda."
            label="Pais"
            name="pais"
            onValueChange={seleccionarPais}
            opciones={opcionesPaises}
            optionValue="codigo"
            placeholder="Selecciona un pais"
            searchPlaceholder="Buscar pais"
            submitValue={paisSeleccionado.nombre.toUpperCase()}
            value={paisUbicacion}
          />

          <input type="hidden" name="departamento" value={departamentoUbigeo} />
          <input type="hidden" name="codigoDepartamento" value={codigoDepartamento} />
          <input type="hidden" name="provincia" value={provinciaUbigeo} />
          <input type="hidden" name="codigoProvincia" value={codigoProvincia} />
          <input type="hidden" name="distrito" value={distritoUbigeo} />
          <input type="hidden" name="codigoDistrito" value={codigoDistrito} />
          <input type="hidden" name="ubigeo" value={ubigeo} />

          {paisUbicacion === "PE" ? (
            <>
              <DistritoGeoAutocomplete
                valorInicial={
                  distritoUbigeo && provinciaUbigeo && departamentoUbigeo
                    ? `${distritoUbigeo}, ${provinciaUbigeo}, ${departamentoUbigeo}`
                    : undefined
                }
                onSeleccionar={seleccionarDistritoGeo}
              />

              <SelectorUbicacionBuscable
                disabled={geoDepartamentos.length === 0}
                emptyText="No hay departamentos cargados desde geo-peru-api."
                label="Departamento"
                name="departamento"
                onValueChange={seleccionarDepartamentoGeo}
                opciones={geoDepartamentos}
                optionValue="codigo"
                placeholder="Selecciona un departamento"
                searchPlaceholder="Buscar departamento"
                submitValue={departamentoUbigeo}
                value={departamentoUbigeo}
              />

              <SelectorUbicacionBuscable
                disabled={!departamentoUbigeo || opcionesGeoProvincias.length === 0}
                emptyText="Selecciona un departamento primero."
                label="Provincia"
                name="provincia"
                onValueChange={seleccionarProvinciaGeo}
                opciones={opcionesGeoProvincias}
                optionValue="codigo"
                placeholder="Selecciona una provincia"
                searchPlaceholder="Buscar provincia"
                submitValue={provinciaUbigeo}
                value={provinciaUbigeo}
              />

              <SelectorUbicacionBuscable
                disabled={!departamentoUbigeo || opcionesGeoDistritos.length === 0}
                emptyText="Selecciona un departamento primero."
                label="Distrito"
                name="distrito"
                onValueChange={seleccionarDistritoGeoCodigo}
                opciones={opcionesGeoDistritos}
                optionValue="codigo"
                placeholder="Selecciona un distrito"
                searchPlaceholder="Buscar distrito"
                submitValue={distritoUbigeo}
                value={distritoUbigeo}
              />
            </>
          ) : (
            <>
              <SelectorUbicacionBuscable
                disabled={opcionesDepartamentos.length === 0}
                emptyText="No hay departamentos cargados para este pais."
                label="Departamento"
                name="departamento"
                onValueChange={seleccionarDepartamento}
                opciones={opcionesDepartamentos}
                placeholder="Selecciona un departamento"
                searchPlaceholder="Buscar departamento"
                submitValue={departamentoUbigeo}
                value={departamentoUbigeo}
              />
              <SelectorUbicacionBuscable
                disabled={!departamentoUbigeo || opcionesProvincias.length === 0}
                emptyText="Selecciona un departamento con provincias cargadas."
                label="Provincia"
                name="provincia"
                onValueChange={seleccionarProvincia}
                opciones={opcionesProvincias}
                placeholder="Selecciona una provincia"
                searchPlaceholder="Buscar provincia"
                submitValue={provinciaUbigeo}
                value={provinciaUbigeo}
              />
              <SelectorUbicacionBuscable
                disabled={!provinciaUbigeo || opcionesDistritos.length === 0}
                emptyText="Selecciona una provincia con distritos cargados."
                label="Distrito"
                name="distrito"
                onValueChange={seleccionarDistrito}
                opciones={opcionesDistritos}
                placeholder="Selecciona un distrito"
                searchPlaceholder="Buscar distrito o codigo INEI"
                submitValue={distritoUbigeo}
                value={distritoUbigeo}
              />
            </>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="direccion">Direccion</label>
            <Input
              id="direccion"
              name="direccion"
              value={direccionUbicacion}
              onChange={(event) => setDireccionUbicacion(event.target.value)}
              placeholder="Av. Principal 123"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="referenciaUbicacion">Referencia</label>
            <Input
              id="referenciaUbicacion"
              name="referenciaUbicacion"
              defaultValue={valoresIniciales?.referenciaUbicacion ?? ""}
              placeholder="Frente al patio principal"
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="coordenadasGoogle">
              Coordenadas (Google Maps)
            </label>
            <Input
              id="coordenadasGoogle"
              name="coordenadasGoogle"
              value={coordenadas}
              placeholder="-16.425802, -71.673141"
              onChange={(event) => setCoordenadas(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Pega la coordenada de Google tal cual (latitud, longitud). Se autocompleta al usar mapa o buscador.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border bg-background p-3 shadow-sm md:sticky md:top-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Mapa</p>
              <p className="text-xs text-muted-foreground">
                Busca lugar o arrastra pin. Ideal para completar direccion y coordenadas.
              </p>
            </div>
            <Badge variant="secondary">Opcional</Badge>
          </div>
          <SelectorUbicacionMapa
            valorInicial={
              valoresIniciales?.latitud != null && valoresIniciales?.longitud != null
                ? { latitud: valoresIniciales.latitud, longitud: valoresIniciales.longitud }
                : undefined
            }
            onSeleccion={alSeleccionarMapa}
          />
        </div>
      </div>
    )
  }

  if (tipo === "SEDE") {
    if (seccion === "detalle") return null
    return (
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="ubicacionIdSede">Ubicacion</label>
        <Select
          name="ubicacionId"
          defaultValue={valoresIniciales?.ubicacionId != null ? String(valoresIniciales.ubicacionId) : undefined}
          onValueChange={(value) =>
            onRelacionChange?.({
              ubicacion: ubicaciones.find(
                (ubicacion) => String(ubicacion.id) === value,
              ),
            })
          }
          required
        >
          <SelectTrigger id="ubicacionIdSede" className="w-full">
            <SelectValue placeholder="Selecciona una ubicacion" />
          </SelectTrigger>
          <SelectContent>
            {ubicaciones.length > 0 ? (
              ubicaciones.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={String(ubicacion.id)}>
                  {ubicacion.codigo} - {ubicacion.nombre}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__sin_ubicaciones" disabled>
                No hay ubicaciones activas
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (tipo === "AREA") {
    if (seccion === "detalle") return null
    return (
      <>
        <p className="text-xs text-muted-foreground md:col-span-2">
          El area cuelga de una sede. Si eliges area superior, se arma la jerarquia dentro de esa sede.
        </p>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="sedeIdArea">Sede</label>
          <Select
            name="sedeId"
            defaultValue={valoresIniciales?.sedeId != null ? String(valoresIniciales.sedeId) : undefined}
            onValueChange={(value) =>
              onRelacionChange?.({
                sede: sedes.find((sede) => String(sede.id) === value),
              })
            }
            required
          >
            <SelectTrigger id="sedeIdArea" className="w-full">
              <SelectValue placeholder="Selecciona una sede" />
            </SelectTrigger>
            <SelectContent>
              {sedes.length > 0 ? (
                sedes.map((sede) => (
                  <SelectItem key={sede.id} value={String(sede.id)}>
                    {sede.codigo} - {sede.nombre}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__sin_sedes" disabled>
                  No hay sedes activas
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nivelArea">Nivel (etiqueta)</label>
          <Select
            name="nivelArea"
            value={nivelArea}
            onValueChange={(value) => {
              const siguienteNivel = value as NivelArea
              setNivelArea(siguienteNivel)
              onRelacionChange?.({ nivelArea: siguienteNivel })
            }}
          >
            <SelectTrigger id="nivelArea" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GERENCIA">Gerencia</SelectItem>
              <SelectItem value="AREA">Area</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Solo es una etiqueta. La profundidad la define el area superior.
          </p>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="gerenciaId">Area superior (padre)</label>
          <Select
            name="gerenciaId"
            defaultValue={valoresIniciales?.gerenciaId != null ? String(valoresIniciales.gerenciaId) : "__none"}
            onValueChange={(value) =>
              onRelacionChange?.({
                gerencia:
                  value === "__none"
                    ? undefined
                    : padresDisponibles.find((padre) => String(padre.id) === value),
              })
            }
          >
            <SelectTrigger id="gerenciaId" className="w-full">
              <SelectValue placeholder="Selecciona el area superior si aplica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Sin superior (area raiz)</SelectItem>
              {padresDisponibles.length > 0 ? (
                padresDisponibles.map((padre) => (
                  <SelectItem key={padre.id} value={String(padre.id)}>
                    {padre.codigo} - {padre.nombre}
                    {padre.nivelArea === "GERENCIA" ? " (Gerencia)" : ""}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__sin_padres" disabled>
                  No hay otras areas disponibles
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Si la dejas vacia, sera un area raiz. Si no, colgara del area elegida
            (jerarquia sin limite de niveles).
          </p>
        </div>
      </>
    )
  }

  if (tipo === "ALMACEN") {
    if (seccion === "detalle") {
      return (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="esTemporal">Temporal</label>
            <Select name="esTemporal" defaultValue={valoresIniciales?.esTemporal ? "true" : "false"}>
              <SelectTrigger id="esTemporal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Si</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fechaInicio">Fecha inicio</label>
            <Input id="fechaInicio" name="fechaInicio" type="date" defaultValue={valoresIniciales?.fechaInicio?.slice(0, 10) ?? ""} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="fechaFin">Fecha fin</label>
            <Input id="fechaFin" name="fechaFin" type="date" defaultValue={valoresIniciales?.fechaFin?.slice(0, 10) ?? ""} />
          </div>
        </>
      )
    }

    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ubicacionIdAlmacen">Ubicacion</label>
          <Select name="ubicacionId" defaultValue={valoresIniciales?.ubicacionId != null ? String(valoresIniciales.ubicacionId) : undefined} required>
            <SelectTrigger id="ubicacionIdAlmacen" className="w-full">
              <SelectValue placeholder="Selecciona una ubicacion" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={String(ubicacion.id)}>
                  {ubicacion.codigo} - {ubicacion.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="sedeIdAlmacen">Sede</label>
          <Select name="sedeId" defaultValue={valoresIniciales?.sedeId != null ? String(valoresIniciales.sedeId) : undefined} required>
            <SelectTrigger id="sedeIdAlmacen" className="w-full">
              <SelectValue placeholder="Selecciona una sede" />
            </SelectTrigger>
            <SelectContent>
              {sedes.map((sede) => (
                <SelectItem key={sede.id} value={String(sede.id)}>
                  {sede.codigo} - {sede.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  if (tipo === "REGIMEN") {
    if (seccion === "relacion") return null
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="regimenCodigo">Codigo regimen</label>
          <Input id="regimenCodigo" name="regimenCodigo" defaultValue={valoresIniciales?.regimenCodigo ?? ""} placeholder="14X7" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="diasTrabajo">Dias trabajo</label>
          <Input id="diasTrabajo" name="diasTrabajo" type="number" min={1} defaultValue={valoresIniciales?.diasTrabajo ?? ""} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="diasDescanso">Dias descanso</label>
          <Input id="diasDescanso" name="diasDescanso" type="number" min={0} defaultValue={valoresIniciales?.diasDescanso ?? ""} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="horasPorDia">Horas por dia</label>
          <Input id="horasPorDia" name="horasPorDia" type="number" min={1} step="0.5" defaultValue={valoresIniciales?.horasPorDia ?? ""} required />
        </div>
      </>
    )
  }

  if (tipo === "CUENTA") {
    if (seccion === "relacion") return null
    // La cuenta no tiene campos propios editables: el backend asigna su nivel.
    return (
      <p className="text-sm text-muted-foreground md:col-span-2">
        La cuenta solo necesita un nombre y una descripcion.
      </p>
    )
  }

  // CONTRATO: el padre (cuenta o contrato) solo se elige al crear; el backend
  // deriva el nivel. En edicion no hay campos propios (el padre es inmutable).
  if (esEdicion) {
    return (
      <p className="text-sm text-muted-foreground md:col-span-2">
        La cuenta o contrato del que depende no se puede cambiar despues de crearlo.
      </p>
    )
  }

  if (seccion === "detalle") return null

  return (
    <>
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="contratoPadreId">Cuenta o contrato principal</label>
        <Select
          name="contratoPadreId"
          onValueChange={(value) => {
            const [tipoPadre, idPadre] = value.split(":")
            const catalogo = tipoPadre === "CUENTA" ? cuentas : contratos
            onRelacionChange?.({
              contratoPadre: catalogo.find(
                (item) => String(item.id) === idPadre,
              ),
            })
          }}
          required
        >
          <SelectTrigger id="contratoPadreId" className="w-full">
            <SelectValue placeholder="Selecciona la cuenta o contrato del que depende" />
          </SelectTrigger>
          <SelectContent>
            {cuentas.length > 0 ? (
              cuentas.map((cuenta) => (
                <SelectItem key={`cuenta-${cuenta.id}`} value={`CUENTA:${cuenta.id}`}>
                  {cuenta.codigo} - {cuenta.nombre}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__sin_cuentas" disabled>
                No hay cuentas activas
              </SelectItem>
            )}
            {contratos
              .filter((contrato) => contrato.id !== valoresIniciales?.id)
              .map((contrato) => (
                <SelectItem key={`contrato-${contrato.id}`} value={`CONTRATO:${contrato.id}`}>
                  {contrato.codigo} - {contrato.nombre}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          El contrato quedara dentro de la cuenta o contrato que elijas.
        </p>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Constructores de payload: traducen FormData -> request del tipo, sin enviar
// campos ajenos al maestro.
// ---------------------------------------------------------------------------

function texto(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim()
  return value && value !== "__none" ? value : undefined
}

function numero(formData: FormData, key: string) {
  const value = texto(formData, key)
  if (!value) return undefined
  const valorNumerico = value.includes(":")
    ? value.slice(value.lastIndexOf(":") + 1)
    : value
  const parsed = Number(valorNumerico)
  return Number.isFinite(parsed) ? parsed : undefined
}

// Separa una coordenada "lat, long" (formato Google) en numeros. Se envia junto
// con coordenadasGoogle para ser compatible tanto con backends que ya hacen la
// conversion como con los que solo aceptan latitud/longitud.
function parseCoordenadas(valor?: string): {
  coordenadasGoogle?: string
  latitud: number | null
  longitud: number | null
} {
  if (!valor) return { coordenadasGoogle: undefined, latitud: null, longitud: null }
  const partes = valor.split(",").map((parte) => parte.trim())
  if (partes.length !== 2) {
    return { coordenadasGoogle: valor, latitud: null, longitud: null }
  }
  const lat = Number(partes[0])
  const lng = Number(partes[1])
  return {
    coordenadasGoogle: valor,
    latitud: Number.isFinite(lat) ? lat : null,
    longitud: Number.isFinite(lng) ? lng : null,
  }
}

/** Construye el request de registro para `tipo` a partir del formulario. */
export function construirPayloadRegistro<T extends TipoDatoMaestro>(
  tipo: T,
  formData: FormData,
  base: { nombre: string; descripcion?: string | null; usuarioCreacion: string },
): RegistrarRequestPorTipo[T] {
  const comun = {
    nombre: base.nombre,
    descripcion: base.descripcion ?? null,
    usuarioCreacion: base.usuarioCreacion,
  }

  switch (tipo) {
    case "CARGO":
      return {
        ...comun,
        cargoSuperiorId: numero(formData, "cargoSuperiorId") ?? null,
        areaId: numero(formData, "areaId"),
      } as RegistrarRequestPorTipo[T]
    case "UBICACION": {
      const coords = parseCoordenadas(texto(formData, "coordenadasGoogle"))
      return {
        ...comun,
        tipoUbicacion: (texto(formData, "tipoUbicacion") as TipoUbicacion | undefined) ?? "OTRO",
        pais: texto(formData, "pais") ?? null,
        departamento: texto(formData, "departamento") ?? null,
        codigoDepartamento: texto(formData, "codigoDepartamento") ?? null,
        provincia: texto(formData, "provincia") ?? null,
        codigoProvincia: texto(formData, "codigoProvincia") ?? null,
        distrito: texto(formData, "distrito") ?? null,
        codigoDistrito: texto(formData, "codigoDistrito") ?? null,
        ubigeo: texto(formData, "ubigeo") ?? null,
        direccion: texto(formData, "direccion") ?? null,
        referenciaUbicacion: texto(formData, "referenciaUbicacion") ?? null,
        coordenadasGoogle: coords.coordenadasGoogle,
        latitud: coords.latitud,
        longitud: coords.longitud,
      } as RegistrarRequestPorTipo[T]
    }
    case "SEDE":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
      } as RegistrarRequestPorTipo[T]
    case "AREA": {
      const nivelArea = (texto(formData, "nivelArea") as NivelArea | undefined) ?? "AREA"
      return {
        ...comun,
        sedeId: numero(formData, "sedeId"),
        nivelArea,
        // gerenciaId es independiente de nivelArea: cualquier area (incluida una
        // gerencia) puede colgar de otra. null = area raiz.
        gerenciaId: numero(formData, "gerenciaId") ?? null,
      } as RegistrarRequestPorTipo[T]
    }
    case "ALMACEN":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
        sedeId: numero(formData, "sedeId"),
        esTemporal: texto(formData, "esTemporal") === "true",
        fechaInicio: texto(formData, "fechaInicio") ?? null,
        fechaFin: texto(formData, "fechaFin") ?? null,
      } as RegistrarRequestPorTipo[T]
    case "REGIMEN":
      return {
        ...comun,
        regimenCodigo: texto(formData, "regimenCodigo") ?? "",
        diasTrabajo: numero(formData, "diasTrabajo"),
        diasDescanso: numero(formData, "diasDescanso"),
        horasPorDia: numero(formData, "horasPorDia"),
      } as RegistrarRequestPorTipo[T]
    case "CUENTA":
      // La cuenta solo envia nombre + descripcion; el backend asigna el nivel.
      return { ...comun } as RegistrarRequestPorTipo[T]
    default: // CONTRATO
      return {
        ...comun,
        contratoPadreId: numero(formData, "contratoPadreId") ?? null,
      } as RegistrarRequestPorTipo[T]
  }
}

/** Construye el request de modificacion para `tipo` a partir del formulario. */
export function construirPayloadModificacion<T extends TipoDatoMaestro>(
  tipo: T,
  formData: FormData,
  base: { nombre: string; descripcion?: string | null; usuarioModificacion: string },
): ModificarRequestPorTipo[T] {
  const comun = {
    nombre: base.nombre,
    descripcion: base.descripcion ?? null,
    usuarioModificacion: base.usuarioModificacion,
  }

  switch (tipo) {
    case "CARGO":
      return {
        ...comun,
        cargoSuperiorId: numero(formData, "cargoSuperiorId") ?? null,
        areaId: numero(formData, "areaId") ?? undefined,
      } as ModificarRequestPorTipo[T]
    case "UBICACION": {
      const coords = parseCoordenadas(texto(formData, "coordenadasGoogle"))
      return {
        ...comun,
        tipoUbicacion: texto(formData, "tipoUbicacion") as TipoUbicacion | undefined,
        pais: texto(formData, "pais") ?? null,
        departamento: texto(formData, "departamento") ?? null,
        codigoDepartamento: texto(formData, "codigoDepartamento") ?? null,
        provincia: texto(formData, "provincia") ?? null,
        codigoProvincia: texto(formData, "codigoProvincia") ?? null,
        distrito: texto(formData, "distrito") ?? null,
        codigoDistrito: texto(formData, "codigoDistrito") ?? null,
        ubigeo: texto(formData, "ubigeo") ?? null,
        direccion: texto(formData, "direccion") ?? null,
        referenciaUbicacion: texto(formData, "referenciaUbicacion") ?? null,
        coordenadasGoogle: coords.coordenadasGoogle,
        latitud: coords.latitud,
        longitud: coords.longitud,
      } as ModificarRequestPorTipo[T]
    }
    case "SEDE":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
      } as ModificarRequestPorTipo[T]
    case "AREA": {
      const nivelArea = texto(formData, "nivelArea") as NivelArea | undefined
      return {
        ...comun,
        sedeId: numero(formData, "sedeId"),
        nivelArea,
        // gerenciaId independiente de nivelArea (jerarquia recursiva). null = raiz.
        gerenciaId: numero(formData, "gerenciaId") ?? null,
      } as ModificarRequestPorTipo[T]
    }
    case "ALMACEN":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
        sedeId: numero(formData, "sedeId"),
        esTemporal: texto(formData, "esTemporal") === "true",
        fechaInicio: texto(formData, "fechaInicio") ?? null,
        fechaFin: texto(formData, "fechaFin") ?? null,
      } as ModificarRequestPorTipo[T]
    case "REGIMEN":
      return {
        ...comun,
        regimenCodigo: texto(formData, "regimenCodigo"),
        diasTrabajo: numero(formData, "diasTrabajo"),
        diasDescanso: numero(formData, "diasDescanso"),
        horasPorDia: numero(formData, "horasPorDia"),
      } as ModificarRequestPorTipo[T]
    // CUENTA y CONTRATO solo modifican nombre/descripcion.
    default:
      return { ...comun } as ModificarRequestPorTipo[T]
  }
}
