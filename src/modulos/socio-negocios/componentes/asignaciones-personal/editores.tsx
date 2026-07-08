"use client"

import { FileText, Plus, Trash2, Wallet } from "lucide-react"

import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { cn } from "@/compartido/utilidades/utils"

import { useAreasPorSedeQuery } from "../../servicios/asignaciones-personal-queries"
import type { ConfiguracionGeneralOpcionResponse } from "../../tipos/asignacion-personal"
import {
  type AprobadorFila,
  type CampoOrganizacion,
  type CatalogosOrganizacion,
  type OpcionCatalogo,
  type RelacionCuentaContratoFila,
  type ValoresOrganizacion,
  aOpcionCatalogo,
  aOpcionContrato,
  agregarOpcionActual,
  contratoPerteneceACuenta,
  crearFilaAprobadorVacia,
  crearFilaContratoVacia,
  crearFilaCuentaVacia,
  obtenerEtiquetaCatalogo,
} from "./utilidades"

// Recibe el catalogo ya cargado (se centraliza la carga en el contenedor para
// no repetir requests por cada selector ni por cada apertura del formulario).
export function SelectCatalogo({
  catalogo,
  cargando = false,
  value,
  onChange,
  enabled,
  placeholder,
  includeNone = true,
  filtrarItems,
}: {
  catalogo: ConfiguracionGeneralOpcionResponse[]
  cargando?: boolean
  value: string
  onChange: (item: ConfiguracionGeneralOpcionResponse | null) => void
  enabled: boolean
  placeholder: string
  includeNone?: boolean
  filtrarItems?: (item: ConfiguracionGeneralOpcionResponse) => boolean
}) {
  const items = catalogo.filter((item) => !filtrarItems || filtrarItems(item))

  return (
    <Select
      value={value || (includeNone ? "__none" : "")}
      disabled={!enabled}
      onValueChange={(v) =>
        onChange(v === "__none" ? null : items.find((item) => String(item.id) === v) ?? null)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNone ? <SelectItem value="__none">Sin asignar</SelectItem> : null}
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {obtenerEtiquetaCatalogo(item)}
            </SelectItem>
          ))}
          {items.length === 0 && !cargando ? (
            <SelectItem value="__vacio" disabled>
              Sin opciones disponibles
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function SelectOpcionesCatalogo({
  opciones,
  value,
  onChange,
  enabled,
  placeholder,
  includeNone = true,
}: {
  opciones: OpcionCatalogo[]
  value: string
  onChange: (item: OpcionCatalogo | null) => void
  enabled: boolean
  placeholder: string
  includeNone?: boolean
}) {
  return (
    <Select
      value={value || (includeNone ? "__none" : "")}
      disabled={!enabled}
      onValueChange={(v) =>
        onChange(v === "__none" ? null : opciones.find((item) => item.id === v) ?? null)
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNone ? <SelectItem value="__none">Sin asignar</SelectItem> : null}
          {opciones.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.codigo} - {item.nombre}
            </SelectItem>
          ))}
          {opciones.length === 0 ? (
            <SelectItem value="__vacio" disabled>
              Sin opciones disponibles
            </SelectItem>
          ) : null}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function FormularioOrganizacion({
  valores,
  onChange,
  habilitado,
  actuales,
  catalogos,
  cargandoCargos = false,
}: {
  valores: ValoresOrganizacion
  onChange: (key: CampoOrganizacion["key"], item: ConfiguracionGeneralOpcionResponse | null) => void
  habilitado: boolean
  actuales?: {
    cargo?: string
    sede?: string
    area?: string
  }
  catalogos: CatalogosOrganizacion
  cargandoCargos?: boolean
}) {
  const cargoSeleccionado = catalogos.cargos.find((cargo) => String(cargo.id) === valores.cargoId)
  // El combo de area depende de la sede elegida. `opciones-formulario` no trae
  // areas (llega vacio), asi que se cargan bajo demanda desde Configuracion
  // General filtrando por la sede seleccionada. Sin sede el combo se deshabilita.
  const areasQuery = useAreasPorSedeQuery(valores.sedeId)
  const areasDeSede = areasQuery.data ?? []
  // Al editar puede venir un area precargada que no este en la lista (otra sede o
  // aun no llego la respuesta); la conservamos para no perder la seleccion.
  const areaActual = catalogos.areas.find((area) => String(area.id) === valores.areaId)
  const areasFiltradas =
    areaActual && !areasDeSede.some((area) => String(area.id) === String(areaActual.id))
      ? [areaActual, ...areasDeSede]
      : areasDeSede
  return (
    <FieldSet className="rounded-lg border border-border p-4">
      <FieldLegend>Datos laborales</FieldLegend>
      <FieldDescription>
        {actuales
          ? "Selecciona solo los campos que deseas cambiar. Lo que no toques conservara su valor actual."
          : "Sede, area y cargo se guardan en la asignacion."}
      </FieldDescription>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel>Sede *</FieldLabel>
          <SelectCatalogo
            catalogo={catalogos.sedes}
            value={valores.sedeId}
            onChange={(item) => onChange("sedeId", item)}
            enabled={habilitado}
            includeNone={false}
            placeholder={actuales?.sede ? `Conservar: ${actuales.sede}` : "Selecciona sede"}
          />
          {actuales?.sede ? (
            <FieldDescription>Actual: {actuales.sede}</FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Area *</FieldLabel>
          <SelectCatalogo
            catalogo={areasFiltradas}
            cargando={areasQuery.isLoading}
            value={valores.areaId}
            onChange={(item) => onChange("areaId", item)}
            enabled={habilitado && Boolean(valores.sedeId) && !areasQuery.isLoading}
            includeNone={false}
            placeholder={
              !valores.sedeId
                ? "Primero selecciona una sede"
                : areasQuery.isLoading
                  ? "Cargando areas..."
                  : actuales?.area
                    ? `Conservar: ${actuales.area}`
                    : "Selecciona area"
            }
          />
          {actuales?.area ? (
            <FieldDescription>Actual: {actuales.area}</FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Cargo *</FieldLabel>
          <SelectCatalogo
            catalogo={catalogos.cargos}
            cargando={cargandoCargos}
            value={valores.cargoId}
            onChange={(item) => onChange("cargoId", item)}
            enabled={habilitado && Boolean(valores.areaId) && !cargandoCargos}
            includeNone={false}
            placeholder={
              !valores.areaId
                ? "Primero selecciona un area"
                : cargandoCargos
                  ? "Cargando cargos..."
                  : actuales?.cargo
                    ? `Conservar: ${actuales.cargo}`
                    : "Selecciona cargo"
            }
          />
          {actuales?.cargo ? (
            <FieldDescription>Actual: {actuales.cargo}</FieldDescription>
          ) : cargoSeleccionado?.cargoSuperiorNombre ? (
            <FieldDescription>Reporta a: {cargoSeleccionado.cargoSuperiorNombre}</FieldDescription>
          ) : null}
        </Field>
      </div>
    </FieldSet>
  )
}

export function EditorRelacionContractual({
  filas,
  onChange,
  cuentasCatalogo,
  contratosCatalogo,
}: {
  filas: RelacionCuentaContratoFila[]
  onChange: (filas: RelacionCuentaContratoFila[]) => void
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[]
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[]
}) {
  function actualizarFila(
    key: string,
    cambios: Partial<RelacionCuentaContratoFila>,
  ) {
    onChange(filas.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)))
  }

  function agregarCuenta() {
    onChange([...filas, crearFilaCuentaVacia()])
  }

  function agregarContrato() {
    onChange([...filas, crearFilaContratoVacia()])
  }

  function eliminarFila(key: string) {
    onChange(filas.filter((fila) => fila.key !== key))
  }

  const contratosPorId = new Map(
    contratosCatalogo.map((item) => [String(item.id), item]),
  )

  return (
    <div className="flex flex-col gap-3">
      {filas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Todavia no agregaste cuentas ni contratos. Agrega una <strong>cuenta</strong> (puede
          llevar un contrato hijo) o un <strong>contrato</strong> por separado: el sistema ubica
          solo su cuenta.
        </div>
      ) : null}

      {filas.map((fila) => {
        const esCuenta = fila.tipo === "CUENTA"
        const opcionesCuenta = agregarOpcionActual(
          cuentasCatalogo.map(aOpcionCatalogo),
          fila.cuenta,
        )
        // En bloque CUENTA, el contrato hijo se filtra por la cuenta elegida
        // (solo hijos directos del primer nivel).
        const opcionesContratoHijo = agregarOpcionActual(
          contratosCatalogo
            .filter((item) => String(item.contratoPadreId ?? "") === fila.cuenta?.id)
            .map(aOpcionContrato),
          fila.contrato,
        )
        // En bloque CONTRATO, la cuenta es solo filtro de ubicacion: si se elige,
        // se muestran todos los contratos de su arbol (con subniveles); si no, todos.
        const contratosFiltrados = fila.cuenta
          ? contratosCatalogo.filter((item) =>
              contratoPerteneceACuenta(item, fila.cuenta!.id, contratosPorId),
            )
          : contratosCatalogo
        const opcionesContratoFiltradas = agregarOpcionActual(
          [...contratosFiltrados]
            .sort((a, b) => (a.nivelCuentaContrato ?? 0) - (b.nivelCuentaContrato ?? 0))
            .map(aOpcionContrato),
          fila.contrato,
        )

        return (
          <div
            key={fila.key}
            className={cn(
              "overflow-hidden rounded-lg border-l-4 bg-card shadow-xs",
              esCuenta
                ? "border-l-sky-500 border-y border-r border-sky-500/30"
                : "border-l-violet-500 border-y border-r border-violet-500/30",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3 border-b px-4 py-2.5",
                esCuenta
                  ? "border-sky-500/20 bg-sky-500/5"
                  : "border-violet-500/20 bg-violet-500/5",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md",
                    esCuenta
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                  )}
                >
                  {esCuenta ? (
                    <Wallet className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">
                    {esCuenta ? "Cuenta" : "Contrato"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {esCuenta
                      ? "Cuenta principal, con contrato hijo opcional"
                      : "Contrato independiente; su cuenta se resuelve sola"}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => eliminarFila(fila.key)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>

            <div className="p-4">
              {esCuenta ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Cuenta *</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesCuenta}
                      value={fila.cuenta?.id ?? ""}
                      onChange={(item) =>
                        actualizarFila(fila.key, { cuenta: item, contrato: null })
                      }
                      enabled
                      includeNone={false}
                      placeholder="Selecciona una cuenta"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Contrato de la cuenta</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesContratoHijo}
                      value={fila.contrato?.id ?? ""}
                      onChange={(item) => actualizarFila(fila.key, { contrato: item })}
                      enabled={Boolean(fila.cuenta)}
                      placeholder={
                        fila.cuenta
                          ? "Opcional: contrato de la cuenta"
                          : "Primero selecciona una cuenta"
                      }
                    />
                    <FieldDescription>
                      Opcional. Solo se muestran contratos de la cuenta elegida.
                    </FieldDescription>
                  </Field>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Cuenta (filtro de ubicacion)</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesCuenta}
                      value={fila.cuenta?.id ?? ""}
                      onChange={(item) =>
                        actualizarFila(fila.key, { cuenta: item, contrato: null })
                      }
                      enabled
                      placeholder="Todas las cuentas"
                    />
                    <FieldDescription>
                      Opcional. Acota los contratos por cuenta; no se guarda como cuenta.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Contrato *</FieldLabel>
                    <SelectOpcionesCatalogo
                      opciones={opcionesContratoFiltradas}
                      value={fila.contrato?.id ?? ""}
                      onChange={(item) => actualizarFila(fila.key, { contrato: item })}
                      enabled
                      includeNone={false}
                      placeholder={
                        fila.cuenta
                          ? "Contrato de la cuenta (incluye subniveles)"
                          : "Selecciona un contrato"
                      }
                    />
                    <FieldDescription>
                      La sangria indica el nivel. El sistema ubica la cuenta del contrato al guardar.
                    </FieldDescription>
                  </Field>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarCuenta}
          className="border-sky-500/40 text-sky-700 hover:bg-sky-500/10 dark:text-sky-400"
        >
          <Wallet data-icon="inline-start" />
          Agregar cuenta
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarContrato}
          className="border-violet-500/40 text-violet-700 hover:bg-violet-500/10 dark:text-violet-400"
        >
          <FileText data-icon="inline-start" />
          Agregar contrato
        </Button>
      </div>
    </div>
  )
}

export function EditorAprobadores({
  filas,
  onChange,
  cargosCatalogo = [],
  cargandoCargos = false,
}: {
  filas: AprobadorFila[]
  onChange: (filas: AprobadorFila[]) => void
  cargosCatalogo?: ConfiguracionGeneralOpcionResponse[]
  cargandoCargos?: boolean
}) {
  function actualizarFila(key: string, cambios: Partial<AprobadorFila>) {
    onChange(filas.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)))
  }

  function agregarFila() {
    onChange([...filas, crearFilaAprobadorVacia()])
  }

  function eliminarFila(key: string) {
    onChange(filas.filter((fila) => fila.key !== key))
  }

  return (
    <div className="flex flex-col gap-3">
      {filas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-4 text-sm text-amber-700">
          Si no agregas quien aprueba, las cuentas y contratos quedaran en espera y no se podran
          aprobar. Agrega al menos una persona que apruebe.
        </div>
      ) : null}

      {filas.map((fila) => (
        <div key={fila.key} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Aprobador</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar aprobador"
              onClick={() => eliminarFila(fila.key)}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel>Cargo aprobador *</FieldLabel>
              <Select
                value={fila.aprobadorCodigo || "__none"}
                disabled={cargandoCargos}
                onValueChange={(value) => {
                  const item = cargosCatalogo.find((cargo) => cargo.codigo === value)
                  if (!item) return
                  actualizarFila(fila.key, {
                    aprobadorCodigo: item.codigo,
                    aprobadorNombre: item.nombre,
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={cargandoCargos ? "Cargando cargos..." : "Selecciona cargo aprobador"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none" disabled>
                      Selecciona cargo aprobador
                    </SelectItem>
                    {cargosCatalogo.map((cargo) => (
                      <SelectItem key={cargo.id} value={cargo.codigo}>
                        {obtenerEtiquetaCatalogo(cargo)}
                      </SelectItem>
                    ))}
                    {cargosCatalogo.length === 0 && !cargandoCargos ? (
                      <SelectItem value="__vacio" disabled>
                        Sin cargos disponibles
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Selecciona cargo que debe aprobar. Al aprobar, backend guardara usuarioId y el
                cargo vigente del usuario.
              </FieldDescription>
            </Field>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={agregarFila}
      >
        <Plus data-icon="inline-start" />
        Agregar aprobador
      </Button>
    </div>
  )
}
