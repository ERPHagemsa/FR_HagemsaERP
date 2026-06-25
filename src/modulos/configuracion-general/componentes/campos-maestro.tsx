"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Search } from "lucide-react"

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

import { ubigeoDistritosPeru, type UbigeoDistritoPeru } from "./data/ubigeo-distritos-peru"
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
    .replace(/[̀-ͯ]/g, "")
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
  const [sedeAreaId, setSedeAreaId] = useState(
    valoresIniciales?.sedeId != null ? String(valoresIniciales.sedeId) : "",
  )
  const gerenciasDisponibles = areas.filter(
    (area) =>
      area.nivelArea === "GERENCIA" &&
      area.id !== valoresIniciales?.id &&
      (!sedeAreaId || String(area.sedeId) === sedeAreaId),
  )

  const [paisUbicacion, setPaisUbicacion] = useState(() =>
    resolverCodigoPais(valoresIniciales?.pais),
  )
  const [departamentoUbigeo, setDepartamentoUbigeo] = useState(valoresIniciales?.departamento ?? "")
  const [provinciaUbigeo, setProvinciaUbigeo] = useState(valoresIniciales?.provincia ?? "")
  const [distritoUbigeo, setDistritoUbigeo] = useState(valoresIniciales?.distrito ?? "")
  const [latitudUbigeo, setLatitudUbigeo] = useState(
    valoresIniciales?.latitud != null ? String(valoresIniciales.latitud) : "",
  )
  const [longitudUbigeo, setLongitudUbigeo] = useState(
    valoresIniciales?.longitud != null ? String(valoresIniciales.longitud) : "",
  )
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

  if (tipo === "REGIMEN") {
    if (seccion === "relacion") return null
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="regimenCodigo">Codigo de regimen</label>
          <Input
            id="regimenCodigo"
            name="regimenCodigo"
            defaultValue={valoresIniciales?.regimenCodigo ?? ""}
            placeholder="14X7"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="horasPorDia">Horas por dia</label>
          <Input
            id="horasPorDia"
            name="horasPorDia"
            type="number"
            min="0"
            step="1"
            defaultValue={valoresIniciales?.horasPorDia != null ? String(valoresIniciales.horasPorDia) : ""}
            placeholder="12"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="diasTrabajo">Dias de trabajo</label>
          <Input
            id="diasTrabajo"
            name="diasTrabajo"
            type="number"
            min="0"
            step="1"
            defaultValue={valoresIniciales?.diasTrabajo != null ? String(valoresIniciales.diasTrabajo) : ""}
            placeholder="14"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="diasDescanso">Dias de descanso</label>
          <Input
            id="diasDescanso"
            name="diasDescanso"
            type="number"
            min="0"
            step="1"
            defaultValue={valoresIniciales?.diasDescanso != null ? String(valoresIniciales.diasDescanso) : ""}
            placeholder="7"
            required
          />
        </div>
      </>
    )
  }

  if (tipo === "CARGO") {
    if (seccion === "detalle") return null
    return (
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="cargoSuperiorId">Cargo superior</label>
        <Select
          name="cargoSuperiorId"
          defaultValue={valoresIniciales?.cargoSuperiorId != null ? String(valoresIniciales.cargoSuperiorId) : "__none"}
          onValueChange={(value) =>
            onRelacionChange?.({
              cargoSuperior:
                value === "__none"
                  ? undefined
                  : cargos.find((cargo) => String(cargo.id) === value),
            })
          }
        >
          <SelectTrigger id="cargoSuperiorId" className="w-full">
            <SelectValue placeholder="Selecciona un cargo superior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sin cargo superior</SelectItem>
            {cargos.filter((cargo) => cargo.id !== valoresIniciales?.id).length > 0 ? (
              cargos
                .filter((cargo) => cargo.id !== valoresIniciales?.id)
                .map((cargo) => (
                  <SelectItem key={cargo.id} value={String(cargo.id)}>
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
    if (seccion === "relacion") return null
    return (
      <>
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
          <Input
            id="direccion"
            name="direccion"
            defaultValue={valoresIniciales?.direccion ?? ""}
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
        <SelectorMaestroBuscable
          datos={sedes}
          defaultValue={valoresIniciales?.sedeId != null ? String(valoresIniciales.sedeId) : ""}
          emptyText="No hay sedes que coincidan con la busqueda"
          label="Sede"
          name="sedeId"
          onValueChange={(value) => {
            setSedeAreaId(value)
            onRelacionChange?.({
              sede: sedes.find((sede) => String(sede.id) === value),
              gerencia: undefined,
            })
          }}
          placeholder="Buscar sede por codigo o nombre"
          required
        />
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nivelArea">Nivel</label>
          <Select
            name="nivelArea"
            value={nivelArea}
            onValueChange={(value) => {
              const siguienteNivel = value as NivelArea
              setNivelArea(siguienteNivel)
              onRelacionChange?.({
                nivelArea: siguienteNivel,
                ...(siguienteNivel === "GERENCIA" ? { gerencia: undefined } : {}),
              })
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
        </div>
        {nivelArea === "AREA" ? (
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="gerenciaId">Gerencia superior</label>
            <Select
              name="gerenciaId"
              defaultValue={valoresIniciales?.gerenciaId != null ? String(valoresIniciales.gerenciaId) : undefined}
              onValueChange={(value) =>
                onRelacionChange?.({
                  gerencia: gerenciasDisponibles.find(
                    (gerencia) => String(gerencia.id) === value,
                  ),
                })
              }
            >
              <SelectTrigger id="gerenciaId" className="w-full">
                <SelectValue placeholder="Selecciona una gerencia si aplica" />
              </SelectTrigger>
              <SelectContent>
                {gerenciasDisponibles.length > 0 ? (
                  gerenciasDisponibles.map((gerencia) => (
                    <SelectItem key={gerencia.id} value={String(gerencia.id)}>
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

  if (tipo === "ALMACEN") {
    return (
      <>
        {seccion !== "detalle" ? <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ubicacionIdAlmacen">Ubicacion</label>
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
            <SelectTrigger id="ubicacionIdAlmacen" className="w-full">
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
        </div> : null}
        {seccion !== "detalle" ? <SelectorMaestroBuscable
          datos={sedes}
          defaultValue={valoresIniciales?.sedeId != null ? String(valoresIniciales.sedeId) : ""}
          emptyText="No hay sedes que coincidan con la busqueda"
          label="Sede"
          name="sedeId"
          onValueChange={(value) =>
            onRelacionChange?.({
              sede: sedes.find((sede) => String(sede.id) === value),
            })
          }
          placeholder="Buscar sede por codigo o nombre"
        /> : null}
        {seccion !== "relacion" ? <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="esTemporal">Temporal</label>
          <Select
            name="esTemporal"
            defaultValue={valoresIniciales?.esTemporal ? "true" : "false"}
            onValueChange={(value) =>
              onRelacionChange?.({ esTemporal: value === "true" })
            }
          >
            <SelectTrigger id="esTemporal" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Si</SelectItem>
            </SelectContent>
          </Select>
        </div> : null}
        {seccion !== "relacion" ? <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="fechaInicio">Fecha inicio</label>
          <Input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            defaultValue={(valoresIniciales?.fechaInicio ?? "").slice(0, 10)}
          />
        </div> : null}
        {seccion !== "relacion" ? <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="fechaFin">Fecha fin</label>
          <Input
            id="fechaFin"
            name="fechaFin"
            type="date"
            defaultValue={(valoresIniciales?.fechaFin ?? "").slice(0, 10)}
          />
        </div> : null}
      </>
    )
  }

  if (tipo === "CUENTA") {
    if (seccion === "relacion") return null
    // La cuenta no tiene campos propios editables: el backend asigna su nivel.
    return (
      <p className="text-sm text-muted-foreground md:col-span-2">
        La cuenta solo necesita nombre y descripcion. El nivel en la jerarquia lo
        asigna el sistema automaticamente.
      </p>
    )
  }

  // CONTRATO: el padre (cuenta o contrato) solo se elige al crear; el backend
  // deriva el nivel. En edicion no hay campos propios (el padre es inmutable).
  if (esEdicion) {
    return (
      <p className="text-sm text-muted-foreground md:col-span-2">
        El contrato padre y el nivel no se modifican. El nivel actual es{" "}
        <span className="font-medium">{valoresIniciales?.nivelCuentaContrato ?? "-"}</span>.
      </p>
    )
  }

  if (seccion === "detalle") return null

  return (
    <>
      <div className="grid gap-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="contratoPadreId">Contrato o cuenta padre</label>
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
            <SelectValue placeholder="Selecciona una cuenta o contrato padre" />
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
          El nivel del contrato se calcula a partir del padre seleccionado.
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
      } as RegistrarRequestPorTipo[T]
    case "UBICACION":
      return {
        ...comun,
        tipoUbicacion: (texto(formData, "tipoUbicacion") as TipoUbicacion | undefined) ?? "OTRO",
        pais: texto(formData, "pais") ?? null,
        departamento: texto(formData, "departamento") ?? null,
        provincia: texto(formData, "provincia") ?? null,
        distrito: texto(formData, "distrito") ?? null,
        direccion: texto(formData, "direccion") ?? null,
        referenciaUbicacion: texto(formData, "referenciaUbicacion") ?? null,
        latitud: numero(formData, "latitud") ?? null,
        longitud: numero(formData, "longitud") ?? null,
      } as RegistrarRequestPorTipo[T]
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
        gerenciaId: nivelArea === "AREA" ? numero(formData, "gerenciaId") ?? null : null,
      } as RegistrarRequestPorTipo[T]
    }
    case "ALMACEN":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
        sedeId: numero(formData, "sedeId") ?? null,
        esTemporal: texto(formData, "esTemporal") === "true",
        fechaInicio: texto(formData, "fechaInicio") ?? null,
        fechaFin: texto(formData, "fechaFin") ?? null,
      } as RegistrarRequestPorTipo[T]
    case "CUENTA":
      // La cuenta solo envia nombre + descripcion; el backend asigna el nivel.
      return { ...comun } as RegistrarRequestPorTipo[T]
    case "REGIMEN":
      return {
        ...comun,
        regimenCodigo: texto(formData, "regimenCodigo") ?? "",
        diasTrabajo: numero(formData, "diasTrabajo") ?? 0,
        diasDescanso: numero(formData, "diasDescanso") ?? 0,
        horasPorDia: numero(formData, "horasPorDia") ?? 0,
      } as RegistrarRequestPorTipo[T]
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
      } as ModificarRequestPorTipo[T]
    case "UBICACION":
      return {
        ...comun,
        tipoUbicacion: texto(formData, "tipoUbicacion") as TipoUbicacion | undefined,
        pais: texto(formData, "pais") ?? null,
        departamento: texto(formData, "departamento") ?? null,
        provincia: texto(formData, "provincia") ?? null,
        distrito: texto(formData, "distrito") ?? null,
        direccion: texto(formData, "direccion") ?? null,
        referenciaUbicacion: texto(formData, "referenciaUbicacion") ?? null,
        latitud: numero(formData, "latitud") ?? null,
        longitud: numero(formData, "longitud") ?? null,
      } as ModificarRequestPorTipo[T]
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
        gerenciaId: nivelArea === "AREA" ? numero(formData, "gerenciaId") ?? null : null,
      } as ModificarRequestPorTipo[T]
    }
    case "ALMACEN":
      return {
        ...comun,
        ubicacionId: numero(formData, "ubicacionId"),
        sedeId: numero(formData, "sedeId") ?? null,
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
