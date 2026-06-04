"use client"

import Link from "next/link"
import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  MapPin,
  Network,
  Search,
  ShieldCheck,
  Warehouse,
} from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
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
import { Separator } from "@/compartido/componentes/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { paisesLatinoamerica } from "@/compartido/datos/ubicaciones"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import { ubigeoDistritosPeru, type UbigeoDistritoPeru } from "./data/ubigeo-distritos-peru"
import {
  useCatalogoConfiguracionGeneralQuery,
  useRegistrarConfiguracionGeneralMutation,
} from "../servicios/configuracion-general-queries"
import type {
  ConfiguracionGeneralResponse,
  NivelArea,
  TipoDatoMaestro,
  TipoUbicacion,
} from "../tipos/configuracion-general"

type RegistroModulo = {
  dependencia: string
  icon: typeof Database
  orden: number
  tipo: TipoDatoMaestro
}

type OpcionUbicacion = {
  codigo: string
  descripcion?: string
  nombre: string
}

const tiposUbicacion: Array<{ value: TipoUbicacion; label: string }> = [
  { value: "SEDE", label: "Sede" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "PLANTA", label: "Planta" },
  { value: "MINA", label: "Mina" },
  { value: "PUERTO", label: "Puerto" },
  { value: "ALMACEN", label: "Almacen" },
  { value: "ALMACEN_TEMPORAL", label: "Almacen temporal" },
  { value: "PATIO", label: "Patio" },
  { value: "TERMINAL", label: "Terminal" },
  { value: "PUNTO_CARGA", label: "Punto de carga" },
  { value: "PUNTO_DESCARGA", label: "Punto de descarga" },
  { value: "PUNTO_ACOPIO", label: "Punto de acopio" },
  { value: "OTRO", label: "Otro" },
]

function normalizarBusquedaUbigeo(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function opcionesUnicas(
  datos: UbigeoDistritoPeru[],
  obtenerNombre: (ubigeo: UbigeoDistritoPeru) => string,
  obtenerCodigo: (ubigeo: UbigeoDistritoPeru) => string,
) {
  const mapa = new Map<string, OpcionUbicacion>()

  datos.forEach((ubigeo) => {
    const nombre = obtenerNombre(ubigeo)

    if (!mapa.has(nombre)) {
      mapa.set(nombre, {
        codigo: obtenerCodigo(ubigeo),
        nombre,
      })
    }
  })

  return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function obtenerPais(codigoPais: string) {
  return paisesLatinoamerica.find((pais) => pais.codigo === codigoPais) ?? paisesLatinoamerica[0]
}

function obtenerDepartamentos(codigoPais: string): OpcionUbicacion[] {
  if (codigoPais === "PE") {
    return opcionesUnicas(
      ubigeoDistritosPeru,
      (ubigeo) => ubigeo.departamento,
      (ubigeo) => ubigeo.inei.slice(0, 2),
    )
  }

  return obtenerPais(codigoPais).departamentos.map((departamento) => ({
    codigo: departamento.codigo,
    nombre: departamento.nombre,
  }))
}

function obtenerProvincias(codigoPais: string, departamento: string): OpcionUbicacion[] {
  if (!departamento) return []

  if (codigoPais === "PE") {
    return opcionesUnicas(
      ubigeoDistritosPeru.filter((ubigeo) => ubigeo.departamento === departamento),
      (ubigeo) => ubigeo.provincia,
      (ubigeo) => ubigeo.inei.slice(0, 4),
    )
  }

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

  if (codigoPais === "PE") {
    return ubigeoDistritosPeru
      .filter((ubigeo) => ubigeo.departamento === departamento && ubigeo.provincia === provincia)
      .map((ubigeo) => ({
        codigo: ubigeo.inei,
        descripcion: `INEI ${ubigeo.inei}`,
        nombre: ubigeo.distrito,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }

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

const modulosRegistro: RegistroModulo[] = [
  {
    orden: 1,
    tipo: "UBICACION",
    icon: MapPin,
    dependencia: "Punto fisico o logistico.",
  },
  {
    orden: 2,
    tipo: "SEDE",
    icon: Building2,
    dependencia: "Centro de trabajo vinculado a una ubicacion.",
  },
  {
    orden: 3,
    tipo: "AREA",
    icon: Network,
    dependencia: "Gerencia o area dentro de una sede.",
  },
  {
    orden: 4,
    tipo: "ALMACEN",
    icon: Warehouse,
    dependencia: "Almacen fijo o temporal.",
  },
  {
    orden: 5,
    tipo: "CUENTA",
    icon: BriefcaseBusiness,
    dependencia: "Cuenta comercial.",
  },
  {
    orden: 6,
    tipo: "CONTRATO",
    icon: ClipboardList,
    dependencia: "Contrato asociado opcionalmente a una cuenta.",
  },
  {
    orden: 7,
    tipo: "CARGO",
    icon: ShieldCheck,
    dependencia: "Puesto y jerarquia de cargo.",
  },
]

const rutasRegistroConfiguracion: Record<TipoDatoMaestro, string> = {
  UBICACION: "ubicacion",
  SEDE: "sede",
  AREA: "area",
  ALMACEN: "almacen",
  CUENTA: "cuenta",
  CONTRATO: "contrato",
  CARGO: "cargo",
}

const detalleFormularioMaestro: Record<
  TipoDatoMaestro,
  {
    alcance: string
    descripcion: string
    resultado: string
    seccion: string
    titulo: string
  }
> = {
  UBICACION: {
    titulo: "Configurar ubicacion",
    descripcion: "Registra un punto fisico o logistico para usarlo luego en sedes y almacenes.",
    alcance: "Base fisica",
    resultado: "Al guardar, la ubicacion quedara disponible para asociarse a nuevas sedes o almacenes.",
    seccion: "Direccion y referencia",
  },
  SEDE: {
    titulo: "Configurar sede",
    descripcion: "Crea una sede de trabajo y enlazala con una ubicacion existente.",
    alcance: "Organizacion",
    resultado: "Al guardar, la sede quedara disponible para registrar areas y operaciones internas.",
    seccion: "Ubicacion de la sede",
  },
  AREA: {
    titulo: "Configurar area",
    descripcion: "Define una gerencia o un area hija dentro de una sede.",
    alcance: "Organizacion",
    resultado: "Al guardar, el area quedara disponible para clasificar personal y procesos.",
    seccion: "Jerarquia del area",
  },
  ALMACEN: {
    titulo: "Configurar almacen",
    descripcion: "Registra un almacen fijo o temporal con su ubicacion operativa.",
    alcance: "Logistica",
    resultado: "Al guardar, el almacen quedara disponible para inventario y abastecimiento.",
    seccion: "Ubicacion y vigencia",
  },
  CUENTA: {
    titulo: "Configurar cuenta",
    descripcion: "Crea una cuenta comercial para agrupar contratos o servicios.",
    alcance: "Comercial",
    resultado: "Al guardar, la cuenta podra usarse en contratos comerciales.",
    seccion: "Datos comerciales",
  },
  CONTRATO: {
    titulo: "Configurar contrato",
    descripcion: "Registra un contrato y vinculalo a una cuenta cuando corresponda.",
    alcance: "Comercial",
    resultado: "Al guardar, el contrato quedara disponible para procesos comerciales relacionados.",
    seccion: "Relacion comercial",
  },
  CARGO: {
    titulo: "Configurar cargo",
    descripcion: "Registra un puesto de trabajo y su cargo superior si aplica.",
    alcance: "Cargos",
    resultado: "Al guardar, el cargo quedara disponible para clasificar personal y socios de negocio.",
    seccion: "Jerarquia del cargo",
  },
}

function etiquetaTipo(tipo: TipoDatoMaestro) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase()
}

function rutaRegistroConfiguracion(tipo: TipoDatoMaestro) {
  return `/configuracion/nuevo/${rutasRegistroConfiguracion[tipo]}`
}

function obtenerTipoDesdeRuta(slug?: string | string[]) {
  const valor = Array.isArray(slug) ? slug[0] : slug
  const tipo = Object.entries(rutasRegistroConfiguracion).find(([, ruta]) => ruta === valor)?.[0]

  return tipo as TipoDatoMaestro | undefined
}

function obtenerModulo(tipo: TipoDatoMaestro) {
  return modulosRegistro.find((modulo) => modulo.tipo === tipo) ?? modulosRegistro[0]
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function valorOpcional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim()
  return value && value !== "__none" ? value : undefined
}

function numeroOpcional(formData: FormData, key: string) {
  const value = valorOpcional(formData, key)
  if (!value) return undefined

  const numero = Number(value)
  return Number.isFinite(numero) ? numero : undefined
}

function ejemplosFormulario(tipo: TipoDatoMaestro) {
  const ejemplos = {
    CARGO: {
      nombre: "Conductor",
      descripcion: "Cargo operativo de transporte.",
    },
    UBICACION: {
      nombre: "Base Lima",
      descripcion: "Ubicacion operativa principal.",
    },
    SEDE: {
      nombre: "Sede Lima",
      descripcion: "Sede administrativa Lima.",
    },
    AREA: {
      nombre: "Gerencia de Operaciones",
      descripcion: "Area responsable de operaciones.",
    },
    CUENTA: {
      nombre: "Cuenta Antamina",
      descripcion: "Cuenta comercial minera.",
    },
    CONTRATO: {
      nombre: "Contrato Transporte 2026",
      descripcion: "Contrato anual de transporte.",
    },
    ALMACEN: {
      nombre: "Almacen Central Lima",
      descripcion: "Almacen fijo principal.",
    },
  } satisfies Record<TipoDatoMaestro, Record<"nombre" | "descripcion", string>>

  return ejemplos[tipo]
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
  const seleccion = datos.find((dato) => dato.id === seleccionado)
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
            ? `#${seleccion.count} - ${seleccion.codigo} - ${seleccion.nombre}`
            : placeholder
        }
      />
      <div className="max-h-48 overflow-auto rounded-md border border-border bg-background">
        {datosFiltrados.length > 0 ? (
          datosFiltrados.map((dato) => {
            const activo = dato.id === seleccionado

            return (
              <button
                key={dato.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => seleccionar(dato.id)}
              >
                <span className="min-w-0 truncate">
                  #{dato.count} - {dato.codigo} - {dato.nombre}
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

function NavegacionRegistroConfiguracion({ tipoActivo }: { tipoActivo: TipoDatoMaestro }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Tipo de maestro</h2>
          <p className="text-sm text-muted-foreground">Selecciona la configuracion que deseas crear.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {modulosRegistro.map((modulo) => {
            const activo = modulo.tipo === tipoActivo
            const Icon = modulo.icon

            return (
              <Button
                key={modulo.tipo}
                asChild
                variant={activo ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
              >
                <Link href={rutaRegistroConfiguracion(modulo.tipo)}>
                  <Icon />
                  {etiquetaTipo(modulo.tipo)}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function OpcionesDependientes({
  areas,
  cargos,
  contratos,
  cuentas,
  nivelArea,
  onNivelAreaChange,
  onSedeAreaChange,
  sedeAreaId,
  sedes,
  tipo,
  ubicaciones,
}: {
  areas: ConfiguracionGeneralResponse[]
  cargos: ConfiguracionGeneralResponse[]
  contratos: ConfiguracionGeneralResponse[]
  cuentas: ConfiguracionGeneralResponse[]
  nivelArea: NivelArea
  onNivelAreaChange: (nivel: NivelArea) => void
  onSedeAreaChange: (sedeId: string) => void
  sedeAreaId: string
  sedes: ConfiguracionGeneralResponse[]
  tipo: TipoDatoMaestro
  ubicaciones: ConfiguracionGeneralResponse[]
}) {
  const gerenciasDisponibles = areas.filter(
    (area) => area.nivelArea === "GERENCIA" && (!sedeAreaId || area.sedeId === sedeAreaId),
  )
  const [paisUbicacion, setPaisUbicacion] = useState("PE")
  const [departamentoUbigeo, setDepartamentoUbigeo] = useState("")
  const [provinciaUbigeo, setProvinciaUbigeo] = useState("")
  const [distritoUbigeo, setDistritoUbigeo] = useState("")
  const [latitudUbigeo, setLatitudUbigeo] = useState("")
  const [longitudUbigeo, setLongitudUbigeo] = useState("")
  const paisSeleccionado = obtenerPais(paisUbicacion)
  const opcionesPaises = useMemo<OpcionUbicacion[]>(
    () => paisesLatinoamerica.map((pais) => ({ codigo: pais.codigo, nombre: pais.nombre })),
    [],
  )
  const opcionesDepartamentos = useMemo(
    () => obtenerDepartamentos(paisUbicacion),
    [paisUbicacion],
  )
  const opcionesProvincias = useMemo(
    () => obtenerProvincias(paisUbicacion, departamentoUbigeo),
    [departamentoUbigeo, paisUbicacion],
  )
  const opcionesDistritos = useMemo(
    () => obtenerDistritos(paisUbicacion, departamentoUbigeo, provinciaUbigeo),
    [departamentoUbigeo, paisUbicacion, provinciaUbigeo],
  )

  function seleccionarPais(codigoPais: string) {
    setPaisUbicacion(codigoPais)
    setDepartamentoUbigeo("")
    setProvinciaUbigeo("")
    setDistritoUbigeo("")
    setLatitudUbigeo("")
    setLongitudUbigeo("")
  }

  function seleccionarDepartamento(departamento: string) {
    setDepartamentoUbigeo(departamento)
    setProvinciaUbigeo("")
    setDistritoUbigeo("")
    setLatitudUbigeo("")
    setLongitudUbigeo("")
  }

  function seleccionarProvincia(provincia: string) {
    setProvinciaUbigeo(provincia)
    setDistritoUbigeo("")
    setLatitudUbigeo("")
    setLongitudUbigeo("")
  }

  function seleccionarDistrito(distrito: string) {
    setDistritoUbigeo(distrito)

    const ubigeo = ubigeoDistritosPeru.find(
      (item) =>
        paisUbicacion === "PE" &&
        item.departamento === departamentoUbigeo &&
        item.provincia === provinciaUbigeo &&
        item.distrito === distrito,
    )

    setLatitudUbigeo(ubigeo?.latitud ?? "")
    setLongitudUbigeo(ubigeo?.longitud ?? "")
  }

  if (tipo === "CARGO") {
    return (
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="cargoSuperiorId">Cargo superior</label>
        <Select name="cargoSuperiorId" defaultValue="__none">
          <SelectTrigger id="cargoSuperiorId" className="w-full">
            <SelectValue placeholder="Selecciona un cargo superior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sin cargo superior</SelectItem>
            {cargos.length > 0 ? (
              cargos.map((cargo) => (
                <SelectItem key={cargo.id} value={cargo.id}>
                  {cargo.codigo} - {cargo.nombre}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__sin_cargos" disabled>
                No hay cargos activos
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (tipo === "UBICACION") {
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="tipoUbicacion">Tipo de ubicacion</label>
          <Select name="tipoUbicacion" defaultValue="SEDE">
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
        <SelectorUbicacionBuscable
          disabled={opcionesDepartamentos.length === 0}
          emptyText="No hay departamentos cargados para este pais."
          label="Departamento"
          name="departamento"
          onValueChange={seleccionarDepartamento}
          opciones={opcionesDepartamentos}
          placeholder="Selecciona un departamento"
          searchPlaceholder="Buscar departamento"
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
          value={distritoUbigeo}
        />
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="direccion">Direccion</label>
          <Input id="direccion" name="direccion" placeholder="Av. Principal 123" />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="referenciaUbicacion">Referencia</label>
          <Input id="referenciaUbicacion" name="referenciaUbicacion" placeholder="Frente al patio principal" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="latitud">Latitud</label>
          <Input
            id="latitud"
            name="latitud"
            type="number"
            step="any"
            value={latitudUbigeo}
            placeholder="-12.046374"
            onChange={(event) => setLatitudUbigeo(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="longitud">Longitud</label>
          <Input
            id="longitud"
            name="longitud"
            type="number"
            step="any"
            value={longitudUbigeo}
            placeholder="-76.98745"
            onChange={(event) => setLongitudUbigeo(event.target.value)}
          />
        </div>
      </>
    )
  }

  if (tipo === "SEDE") {
    return (
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="ubicacionIdSede">Ubicacion</label>
        <Select name="ubicacionId" required>
          <SelectTrigger id="ubicacionIdSede" className="w-full">
            <SelectValue placeholder="Selecciona una ubicacion" />
          </SelectTrigger>
          <SelectContent>
            {ubicaciones.length > 0 ? (
              ubicaciones.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={ubicacion.id}>
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
    return (
      <>
        <SelectorMaestroBuscable
          datos={sedes}
          emptyText="No hay sedes que coincidan con la busqueda"
          label="Sede"
          name="sedeId"
          onValueChange={onSedeAreaChange}
          placeholder="Buscar sede por codigo o nombre"
          required
        />
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nivelArea">Nivel</label>
          <Select
            name="nivelArea"
            value={nivelArea}
            onValueChange={(value) => onNivelAreaChange(value as NivelArea)}
          >
            <SelectTrigger id="nivelArea" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GERENCIA">Gerencia</SelectItem>
              <SelectItem value="AREA">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {nivelArea === "AREA" ? (
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="gerenciaId">Gerencia superior</label>
            <Select name="gerenciaId">
              <SelectTrigger id="gerenciaId" className="w-full">
                <SelectValue placeholder="Selecciona una gerencia si aplica" />
              </SelectTrigger>
              <SelectContent>
                {gerenciasDisponibles.length > 0 ? (
                  gerenciasDisponibles.map((gerencia) => (
                    <SelectItem key={gerencia.id} value={gerencia.id}>
                      {gerencia.codigo} - {gerencia.nombre}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__sin_gerencias" disabled>
                    No hay gerencias para la sede seleccionada
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </>
    )
  }

  if (tipo === "CUENTA") return null

  if (tipo === "ALMACEN") {
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ubicacionIdAlmacen">Ubicacion</label>
          <Select name="ubicacionId" required>
            <SelectTrigger id="ubicacionIdAlmacen" className="w-full">
              <SelectValue placeholder="Selecciona una ubicacion" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.length > 0 ? (
                ubicaciones.map((ubicacion) => (
                  <SelectItem key={ubicacion.id} value={ubicacion.id}>
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
        <SelectorMaestroBuscable
          datos={sedes}
          emptyText="No hay sedes que coincidan con la busqueda"
          label="Sede"
          name="sedeId"
          placeholder="Buscar sede por codigo o nombre"
        />
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="esTemporal">Temporal</label>
          <Select name="esTemporal" defaultValue="false">
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
          <Input id="fechaInicio" name="fechaInicio" type="date" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="fechaFin">Fecha fin</label>
          <Input id="fechaFin" name="fechaFin" type="date" />
        </div>
      </>
    )
  }

  return (
    <div className="grid gap-2 md:col-span-2">
      <label className="text-sm font-medium" htmlFor="contratoPadreId">Contrato padre</label>
      <Select name="contratoPadreId" required>
        <SelectTrigger id="contratoPadreId" className="w-full">
          <SelectValue placeholder="Selecciona una cuenta o contrato padre" />
        </SelectTrigger>
        <SelectContent>
          {cuentas.length > 0 ? (
            cuentas.map((cuenta) => (
              <SelectItem key={cuenta.id} value={cuenta.id}>
                Nivel {cuenta.nivelCuentaContrato ?? 1} - {cuenta.codigo} - {cuenta.nombre}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__sin_cuentas" disabled>
              No hay cuentas activas
            </SelectItem>
          )}
          {contratos.map((contrato) => (
            <SelectItem key={contrato.id} value={contrato.id}>
              Nivel {contrato.nivelCuentaContrato ?? "-"} - {contrato.codigo} - {contrato.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ConfiguracionGeneralRegistroRutaVista({ slug }: { slug?: string | string[] }) {
  const tipo = obtenerTipoDesdeRuta(slug)

  if (!tipo) {
    return <ConfiguracionGeneralRegistroVista tipoInicial="UBICACION" />
  }

  return <ConfiguracionGeneralRegistroVista tipoInicial={tipo} />
}

export function ConfiguracionGeneralRegistroVista({ tipoInicial }: { tipoInicial: TipoDatoMaestro }) {
  const { usuario } = useSesion()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tipoNuevo = tipoInicial
  const detalleFormulario = detalleFormularioMaestro[tipoNuevo]
  const moduloFormulario = obtenerModulo(tipoNuevo)
  const IconoFormulario = moduloFormulario.icon
  const [nivelAreaNuevo, setNivelAreaNuevo] = useState<NivelArea>("AREA")
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [sedeAreaId, setSedeAreaId] = useState("")
  const ejemplos = ejemplosFormulario(tipoNuevo)
  const ubicacionesQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "UBICACION",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const cargosQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CARGO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const sedesQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "SEDE",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const areasQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "AREA",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const cuentasQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const contratosQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CONTRATO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const registrarMutation = useRegistrarConfiguracionGeneralMutation()
  const ubicaciones = ubicacionesQuery.data?.datos ?? []
  const cargos = cargosQuery.data?.datos ?? []
  const sedes = sedesQuery.data?.datos ?? []
  const areas = areasQuery.data?.datos ?? []
  const cuentas = cuentasQuery.data?.datos ?? []
  const contratos = contratosQuery.data?.datos ?? []
  const bloqueoDependencia =
    tipoNuevo === "SEDE" && ubicaciones.length === 0
      ? {
          mensaje: "Primero registra una ubicacion para crear una sede.",
          accion: "Registrar ubicacion",
          tipoDestino: "UBICACION" as TipoDatoMaestro,
        }
      : tipoNuevo === "AREA" && sedes.length === 0
        ? {
            mensaje: "Primero registra una sede para crear areas.",
            accion: "Registrar sede",
            tipoDestino: "SEDE" as TipoDatoMaestro,
          }
        : tipoNuevo === "CONTRATO" && cuentas.length === 0 && contratos.length === 0
          ? {
              mensaje: "Primero registra una cuenta o contrato padre para crear contratos.",
              accion: "Registrar cuenta",
              tipoDestino: "CUENTA" as TipoDatoMaestro,
            }
        : tipoNuevo === "ALMACEN" && ubicaciones.length === 0
          ? {
              mensaje: "Primero registra una ubicacion para crear almacenes.",
                accion: "Registrar ubicacion",
                tipoDestino: "UBICACION" as TipoDatoMaestro,
              }
            : null

  function limpiarFormulario() {
    setNivelAreaNuevo("AREA")
    setNombreNuevo("")
    setSedeAreaId("")
  }

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje(null)
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const cargoSuperiorId = valorOpcional(formData, "cargoSuperiorId")
    const ubicacionId = valorOpcional(formData, "ubicacionId")
    const tipoUbicacion = valorOpcional(formData, "tipoUbicacion") as TipoUbicacion | undefined
    const direccion = valorOpcional(formData, "direccion")
    const pais = valorOpcional(formData, "pais")
    const departamento = valorOpcional(formData, "departamento")
    const provincia = valorOpcional(formData, "provincia")
    const distrito = valorOpcional(formData, "distrito")
    const referenciaUbicacion = valorOpcional(formData, "referenciaUbicacion")
    const latitud = numeroOpcional(formData, "latitud")
    const longitud = numeroOpcional(formData, "longitud")
    const sedeId = valorOpcional(formData, "sedeId")
    const nivelArea = valorOpcional(formData, "nivelArea") as NivelArea | undefined
    const gerenciaId = valorOpcional(formData, "gerenciaId")
    const esTemporal = valorOpcional(formData, "esTemporal") === "true"
    const fechaInicio = valorOpcional(formData, "fechaInicio")
    const fechaFin = valorOpcional(formData, "fechaFin")
    const contratoPadreId = valorOpcional(formData, "contratoPadreId")

    if (tipoNuevo === "AREA") {
      if (!sedeId) {
        setError("Selecciona la sede a la que pertenece el area.")
        return
      }

    }

    if (tipoNuevo === "UBICACION" && (!pais || !nombreNuevo.trim())) {
      setError("Completa el nombre y pais de la ubicacion.")
      return
    }

    if (tipoNuevo === "CONTRATO" && !contratoPadreId) {
      setError("Selecciona la cuenta o contrato padre.")
      return
    }

    if (tipoNuevo === "SEDE" && !ubicacionId) {
      setError("Selecciona la ubicacion de la sede.")
      return
    }

    if (tipoNuevo === "ALMACEN" && !ubicacionId) {
      setError("Selecciona la ubicacion del almacen.")
      return
    }

    try {
      const creado = await registrarMutation.mutateAsync({
        tipoDatoMaestro: tipoNuevo,
        nombre: nombreNuevo.trim(),
        descripcion: valorOpcional(formData, "descripcion") ?? null,
        ...(tipoNuevo === "CARGO" ? { cargoSuperiorId: cargoSuperiorId ?? null } : {}),
        ...(tipoNuevo === "UBICACION"
          ? {
              tipoUbicacion: tipoUbicacion ?? "OTRO",
              direccion: direccion ?? null,
              pais: pais ?? null,
              departamento: departamento ?? null,
              provincia: provincia ?? null,
              distrito: distrito ?? null,
              referenciaUbicacion: referenciaUbicacion ?? null,
              latitud: latitud ?? null,
              longitud: longitud ?? null,
            }
          : {}),
        ...(tipoNuevo === "SEDE" ? { ubicacionId: ubicacionId ?? null } : {}),
        ...(tipoNuevo === "AREA"
          ? {
              sedeId: sedeId ?? null,
              nivelArea: nivelArea ?? null,
              gerenciaId: nivelArea === "AREA" ? gerenciaId ?? null : null,
            }
          : {}),
        ...(tipoNuevo === "ALMACEN"
          ? {
              ubicacionId: ubicacionId ?? null,
              sedeId: sedeId ?? null,
              esTemporal,
              fechaInicio: fechaInicio ?? null,
              fechaFin: fechaFin ?? null,
            }
          : {}),
        ...(tipoNuevo === "CONTRATO"
          ? {
              contratoPadreId,
            }
          : {}),
        usuarioCreacion: usuario?.email ?? "admin",
      })
      form.reset()
      limpiarFormulario()
      setMensaje(
        `${creado.tipoDatoMaestro} #${creado.count} - ${creado.codigo} fue registrado.`,
      )
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <SiteHeader
        title="Nueva configuracion"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Nueva configuracion", href: "/configuracion/nuevo/ubicacion" },
          { title: etiquetaTipo(tipoNuevo) },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5">
          {mensaje ? (
            <Alert>
              <AlertTitle>Registro completado</AlertTitle>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo registrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <NavegacionRegistroConfiguracion tipoActivo={tipoNuevo} />

          {bloqueoDependencia ? (
            <Alert>
              <AlertTitle>Falta una configuracion previa</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span>{bloqueoDependencia.mensaje}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={rutaRegistroConfiguracion(bloqueoDependencia.tipoDestino)}>
                    {bloqueoDependencia.accion}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <form
            className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
            onSubmit={(event) => void registrar(event)}
          >
            <div className="border-b border-border px-5 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                    <IconoFormulario />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold leading-7">{detalleFormulario.titulo}</h2>
                      <Badge variant="secondary">{detalleFormulario.alcance}</Badge>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
                      {detalleFormulario.descripcion}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit rounded-full">
                  Activo al guardar
                </Badge>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid min-w-0 gap-5 p-5">
                <section className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold">Datos generales</h3>
                    <p className="text-sm text-muted-foreground">
                      Ingresa el nombre visible y una descripcion corta para reconocer esta configuracion.
                    </p>
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="nombre">Nombre</label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={nombreNuevo}
                      placeholder={ejemplos.nombre}
                      onChange={(event) => setNombreNuevo(event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="descripcion">Descripcion</label>
                    <Textarea id="descripcion" name="descripcion" placeholder={ejemplos.descripcion} />
                  </div>
                </section>

                <Separator />

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold">{detalleFormulario.seccion}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completa los campos propios de {etiquetaTipo(tipoNuevo).toLowerCase()}.
                    </p>
                  </div>
                  <OpcionesDependientes
                    areas={areas}
                    cargos={cargos}
                    contratos={contratos}
                    cuentas={cuentas}
                    nivelArea={nivelAreaNuevo}
                    onNivelAreaChange={setNivelAreaNuevo}
                    onSedeAreaChange={setSedeAreaId}
                    sedeAreaId={sedeAreaId}
                    sedes={sedes}
                    tipo={tipoNuevo}
                    ubicaciones={ubicaciones}
                  />
                </section>
              </div>

              <aside className="border-t border-border bg-muted/20 p-5 xl:border-l xl:border-t-0">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">Resultado</h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {detalleFormulario.resultado}
                    </p>
                  </div>
                  <Separator />
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Codigo</span>
                      <Badge variant="outline">Automatico</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Estado inicial</span>
                      <Badge variant="outline">Activo</Badge>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="sm:w-auto">
                <Link href="/configuracion/listar">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                className="sm:w-auto"
                disabled={registrarMutation.isPending || Boolean(bloqueoDependencia)}
              >
                <CheckCircle2 className="size-4" />
                {registrarMutation.isPending ? "Guardando..." : "Guardar configuracion"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}

