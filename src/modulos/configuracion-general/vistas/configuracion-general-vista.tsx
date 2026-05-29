"use client"

import Link from "next/link"
import type { FormEvent } from "react"
import { useState } from "react"
import {
  Ban,
  CheckCircle2,
  Database,
  FileDown,
  History,
  Plus,
  Search,
} from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Input } from "@/compartido/componentes/ui/input"
import { Separator } from "@/compartido/componentes/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { paisesLatinoamerica } from "@/compartido/datos/ubicaciones"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useCatalogoConfiguracionGeneralQuery,
  useConfiguracionGeneralQuery,
  useEstadoBcConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
  useRegistrarConfiguracionGeneralMutation,
} from "../servicios/configuracion-general-queries"
import type {
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoDatoMaestro,
  EstadoRegistro,
  NivelArea,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

const tipos: Array<{ value: "TODOS" | TipoDatoMaestro; label: string }> = [
  { value: "TODOS", label: "Tipo: todos" },
  { value: "CARGO", label: "Cargo" },
  { value: "SEDE", label: "Sede" },
  { value: "AREA", label: "Area" },
  { value: "CUENTA", label: "Cuenta" },
  { value: "CONTRATO", label: "Contrato" },
]

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

function nombreTipo(tipo: TipoDatoMaestro) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase()
}

function eventoPrincipal(dato: ConfiguracionGeneralResponse) {
  const base = nombreTipo(dato.tipoDatoMaestro)

  if (dato.estadoRegistro === "ANULADO") return `${base} anulado`
  if (dato.estado === "INACTIVO") return `${base} inhabilitado`
  if (dato.fechaModificacion) return `${base} actualizado`
  return `${base} habilitado`
}

function detalleEspecifico(dato: ConfiguracionGeneralResponse) {
  if (dato.tipoDatoMaestro === "SEDE") return dato.direccion || "-"
  if (dato.tipoDatoMaestro === "AREA") return dato.sedeId || "-"
  if (dato.tipoDatoMaestro === "CUENTA") return dato.tipoCuenta || "-"
  if (dato.tipoDatoMaestro === "CONTRATO") return dato.tipoContrato || "-"
  return "-"
}

function etiquetaDetalleEspecifico(tipo: TipoDatoMaestro) {
  if (tipo === "SEDE") return "Direccion"
  if (tipo === "AREA") return "Sede"
  if (tipo === "CUENTA") return "Tipo de cuenta"
  if (tipo === "CONTRATO") return "Tipo de contrato"
  return "Dato especifico"
}

function textoEstadoConfiguracion(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "Retirada"
  if (dato.estado === "INACTIVO") return "Pausada"
  return "Disponible"
}

function textoVigencia(estadoRegistro: EstadoRegistro) {
  return estadoRegistro === "ANULADO" ? "Retirada" : "Vigente"
}

function valorOpcional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim()
  return value && value !== "__none" ? value : undefined
}

function ejemplosFormulario(tipo: TipoDatoMaestro) {
  const ejemplos = {
    CARGO: {
      codigo: "CARGO-013",
      nombre: "Supervisor de Patio",
      descripcion: "Supervisa patio y control de unidades.",
    },
    SEDE: {
      codigo: "SEDE-009",
      nombre: "Base Tacna",
      descripcion: "Base de soporte sur.",
    },
    AREA: {
      codigo: "AREA-010",
      nombre: "Control Documentario",
      descripcion: "Control de guias, manifiestos y documentos.",
    },
    CUENTA: {
      codigo: "CTA-007",
      nombre: "Cuenta Construccion Sur",
      descripcion: "Cuenta para clientes de construccion.",
    },
    CONTRATO: {
      codigo: "CONT-009",
      nombre: "Contrato Construccion Sur 2026",
      descripcion: "Servicio logistico para proyecto de construccion.",
    },
  } satisfies Record<TipoDatoMaestro, Record<"codigo" | "nombre" | "descripcion", string>>

  return ejemplos[tipo]
}

function CamposEspecificosMaestro({
  areas,
  cargos,
  cuentas,
  departamento,
  distrito,
  nivelArea,
  onNivelAreaChange,
  onUbicacionChange,
  pais,
  provincia,
  sedes,
  tipo,
}: {
  areas: ConfiguracionGeneralResponse[]
  cargos: ConfiguracionGeneralResponse[]
  cuentas: ConfiguracionGeneralResponse[]
  departamento: string
  distrito: string
  nivelArea: NivelArea
  onNivelAreaChange: (nivel: NivelArea) => void
  onUbicacionChange: (ubicacion: {
    pais?: string
    departamento?: string
    provincia?: string
    distrito?: string
  }) => void
  pais: string
  provincia: string
  sedes: ConfiguracionGeneralResponse[]
  tipo: TipoDatoMaestro
}) {
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
            {cargos.map((cargo) => (
              <SelectItem key={cargo.id} value={cargo.id}>
                {cargo.codigo} - {cargo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (tipo === "SEDE") {
    const paisSeleccionado = paisesLatinoamerica.find((item) => item.nombre === pais)
    const departamentos = paisSeleccionado?.departamentos ?? []
    const departamentoSeleccionado = departamentos.find((item) => item.nombre === departamento)
    const provincias = departamentoSeleccionado?.provincias ?? []
    const provinciaSeleccionada = provincias.find((item) => item.nombre === provincia)
    const distritos = provinciaSeleccionada?.distritos ?? []
    const usarCatalogo = departamentos.length > 0

    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="direccionSede">Direccion</label>
          <Input id="direccionSede" name="direccion" placeholder="Av. Principal 123" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="pais">Pais</label>
          <Select
            name="pais"
            value={pais}
            onValueChange={(value) => {
              onUbicacionChange({
                pais: value,
                departamento: "",
                provincia: "",
                distrito: "",
              })
            }}
            required
          >
            <SelectTrigger id="pais" className="w-full">
              <SelectValue placeholder="Selecciona un pais" />
            </SelectTrigger>
            <SelectContent>
              {paisesLatinoamerica.map((item) => (
                <SelectItem key={item.codigo} value={item.nombre}>
                  {item.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {usarCatalogo ? (
          <>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="departamento">Departamento</label>
              <Select
                name="departamento"
                value={departamento}
                onValueChange={(value) => {
                  onUbicacionChange({
                    departamento: value,
                    provincia: "",
                    distrito: "",
                  })
                }}
                required
              >
                <SelectTrigger id="departamento" className="w-full">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((item) => (
                    <SelectItem key={item.codigo} value={item.nombre}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="provincia">Provincia</label>
              <Select
                name="provincia"
                value={provincia}
                onValueChange={(value) => {
                  onUbicacionChange({
                    provincia: value,
                    distrito: "",
                  })
                }}
                required
              >
                <SelectTrigger id="provincia" className="w-full">
                  <SelectValue placeholder="Selecciona una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((item) => (
                    <SelectItem key={item.codigo} value={item.nombre}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="distrito">Distrito</label>
              <Select
                name="distrito"
                value={distrito}
                onValueChange={(value) => onUbicacionChange({ distrito: value })}
                required
              >
                <SelectTrigger id="distrito" className="w-full">
                  <SelectValue placeholder="Selecciona un distrito" />
                </SelectTrigger>
                <SelectContent>
                  {distritos.map((item) => (
                    <SelectItem key={item.codigo} value={item.nombre}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="departamento">Departamento / Region</label>
              <Input id="departamento" name="departamento" placeholder="Region" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="provincia">Provincia / Ciudad</label>
              <Input id="provincia" name="provincia" placeholder="Provincia" required />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="distrito">Distrito / Comuna</label>
              <Input id="distrito" name="distrito" placeholder="Distrito" required />
            </div>
          </>
        )}
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ciudad">Ciudad</label>
          <Input id="ciudad" name="ciudad" placeholder={provincia || "Ciudad"} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="referenciaUbicacion">Referencia</label>
          <Input id="referenciaUbicacion" name="referenciaUbicacion" placeholder="Zona industrial" />
        </div>
      </>
    )
  }

  if (tipo === "AREA") {
    return (
      <>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="sedeId">Sede</label>
          <Select name="sedeId" required>
            <SelectTrigger id="sedeId" className="w-full">
              <SelectValue placeholder="Selecciona una sede activa" />
            </SelectTrigger>
            <SelectContent>
              {sedes.map((sede) => (
                <SelectItem key={sede.id} value={sede.id}>
                  {sede.codigo} - {sede.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              <SelectItem value="AREA">Area</SelectItem>
              <SelectItem value="GERENCIA">Gerencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {nivelArea === "AREA" ? (
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="gerenciaId">Gerencia</label>
            <Select name="gerenciaId" required>
              <SelectTrigger id="gerenciaId" className="w-full">
                <SelectValue placeholder="Selecciona una gerencia" />
              </SelectTrigger>
              <SelectContent>
                {areas
                  .filter((area) => area.nivelArea === "GERENCIA")
                  .map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.codigo} - {area.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </>
    )
  }

  if (tipo === "CUENTA") {
    return (
      <>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="tipoCuenta">Tipo de cuenta</label>
          <Select name="tipoCuenta" defaultValue="OPERATIVA">
            <SelectTrigger id="tipoCuenta" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPERATIVA">Operativa</SelectItem>
              <SelectItem value="ADMINISTRATIVA">Administrativa</SelectItem>
              <SelectItem value="COMERCIAL">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="tipoContrato">Tipo de contrato</label>
        <Select name="tipoContrato" defaultValue="ANUAL">
          <SelectTrigger id="tipoContrato" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANUAL">Anual</SelectItem>
            <SelectItem value="MENSUAL">Mensual</SelectItem>
            <SelectItem value="PROYECTO">Por proyecto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="cuentaId">Cuenta</label>
        <Select name="cuentaId" defaultValue="__none">
          <SelectTrigger id="cuentaId" className="w-full">
            <SelectValue placeholder="Selecciona una cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sin cuenta asociada</SelectItem>
            {cuentas.map((cuenta) => (
              <SelectItem key={cuenta.id} value={cuenta.id}>
                {cuenta.codigo} - {cuenta.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function EstadoDatoBadge({ dato }: { dato: ConfiguracionGeneralResponse }) {
  const esAnulado = dato.estadoRegistro === "ANULADO"
  const esActivo = dato.estado === "ACTIVO" && !esAnulado

  return (
    <Badge
      variant={esAnulado ? "destructive" : "outline"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {esActivo ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <Ban className="size-3.5 text-destructive" />
      )}
      {textoEstadoConfiguracion(dato)}
    </Badge>
  )
}

function TipoBadge({ tipo }: { tipo: TipoDatoMaestro }) {
  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {tipo}
    </Badge>
  )
}

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="break-words text-sm">{value || "-"}</span>
    </div>
  )
}

function MetricasMaestros({
  datos,
  total,
  historial,
  cargando,
}: {
  datos: ConfiguracionGeneralResponse[]
  total: number
  historial?: number
  cargando?: boolean
}) {
  const activosVigentes = datos.filter(
    (dato) => dato.estado === "ACTIVO" && dato.estadoRegistro === "ACTIVO",
  ).length
  const inactivos = datos.filter((dato) => dato.estado === "INACTIVO").length
  const anulados = datos.filter((dato) => dato.estadoRegistro === "ANULADO").length

  const metricas = [
    {
      etiqueta: "Configuraciones",
      valor: total || datos.length,
      detalle: "Cargo, Sede, Area, Cuenta y Contrato consultados.",
      icon: Database,
      contexto: "Catálogo",
    },
    {
      etiqueta: "Activos vigentes",
      valor: activosVigentes,
      detalle: "Disponibles para los procesos que usan configuración.",
      icon: CheckCircle2,
      contexto: "Operativos",
    },
    {
      etiqueta: "Inactivos / anulados",
      valor: inactivos + anulados,
      detalle: `${inactivos} inactivos y ${anulados} anulados en la consulta.`,
      icon: Ban,
      contexto: "Seguimiento",
    },
    {
      etiqueta: "Cambios",
      valor: historial ?? "-",
      detalle: "Movimientos registrados para seguimiento.",
      icon: History,
      contexto: "Trazabilidad",
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metricas.map((metrica) => (
        <Card key={metrica.etiqueta} className="overflow-hidden border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardDescription className="truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {metrica.etiqueta}
              </CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-normal">
                {cargando ? "-" : metrica.valor}
              </CardTitle>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
              <metrica.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <p className="min-h-10 text-sm leading-5 text-muted-foreground">
              {metrica.detalle}
            </p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{metrica.contexto}</span>
              <Badge
                variant="outline"
                className="h-6 shrink-0 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
              >
                Control
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function TablaDatosMaestros({
  datos,
  cargando,
  onSelect,
}: {
  datos: ConfiguracionGeneralResponse[]
  cargando?: boolean
  onSelect?: (dato: ConfiguracionGeneralResponse) => void
}) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No existen configuraciones para la consulta aplicada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead>Tipo</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Dato especifico</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Último movimiento</TableHead>
            <TableHead>Modificacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => (
            <TableRow
              key={dato.id}
              className={onSelect ? "cursor-pointer border-border/80" : "border-border/80"}
              onClick={() => onSelect?.(dato)}
            >
              <TableCell>
                <TipoBadge tipo={dato.tipoDatoMaestro} />
              </TableCell>
              <TableCell className="font-mono text-xs">{dato.codigo}</TableCell>
              <TableCell>
                <div className="flex min-w-56 flex-col">
                  <span className="font-medium">{dato.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.descripcion || "Sin descripcion"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex min-w-44 flex-col">
                  <span>{detalleEspecifico(dato)}</span>
                  <span className="text-xs text-muted-foreground">
                    {etiquetaDetalleEspecifico(dato.tipoDatoMaestro)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <EstadoDatoBadge dato={dato} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={dato.estadoRegistro === "ACTIVO" ? "outline" : "destructive"}
                  className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                >
                  {textoVigencia(dato.estadoRegistro)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{eventoPrincipal(dato)}</TableCell>
              <TableCell>
                <div className="flex min-w-40 flex-col">
                  <span>{formatearFecha(dato.fechaModificacion || dato.fechaCreacion)}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.usuarioModificacion || dato.usuarioCreacion}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FiltrosMaestros({
  query,
  setQuery,
  onExportar,
  exportando,
}: {
  query: ConsultarConfiguracionGeneralQuery
  setQuery: (query: ConsultarConfiguracionGeneralQuery) => void
  onExportar?: () => void
  exportando?: boolean
}) {
  function actualizar(
    key: keyof ConsultarConfiguracionGeneralQuery,
    value: string,
  ) {
    const siguiente = { ...query, page: 1 }

    if (value === "TODOS" || value === "") {
      delete siguiente[key]
    } else {
      Object.assign(siguiente, { [key]: value })
    }

    setQuery(siguiente)
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
      <form className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query.nombre ?? query.codigo ?? ""}
            onChange={(event) => actualizar("nombre", event.target.value)}
            placeholder="Buscar codigo o nombre"
            className="pl-9"
          />
        </div>
        <Select
          value={query.tipoDatoMaestro ?? "TODOS"}
          onValueChange={(value) => actualizar("tipoDatoMaestro", value as TipoDatoMaestro | "TODOS")}
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipos.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.estado ?? "TODOS"}
          onValueChange={(value) => actualizar("estado", value as EstadoDatoMaestro | "TODOS")}
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Estado: todos</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.estadoRegistro ?? "TODOS"}
          onValueChange={(value) => actualizar("estadoRegistro", value as EstadoRegistro | "TODOS")}
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Registro: todos</SelectItem>
            <SelectItem value="ACTIVO">Vigente</SelectItem>
            <SelectItem value="ANULADO">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/configuracion/nuevo">
            <Plus className="size-4" />
            Nueva configuración
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onExportar} disabled={exportando}>
          <FileDown className="size-4" />
          {exportando ? "Exportando..." : "Exportar"}
        </Button>
      </div>
    </div>
  )
}

function ConteoPorTipo({ datos }: { datos: ConfiguracionGeneralResponse[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Distribucion</CardTitle>
        <CardDescription>Registros agrupados por tipo de configuración.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {tipos
          .filter((tipo) => tipo.value !== "TODOS")
          .map((tipo) => (
            <div key={tipo.value} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{tipo.label.replace("Tipo: ", "")}</span>
              <span className="font-medium tabular-nums">
                {datos.filter((dato) => dato.tipoDatoMaestro === tipo.value).length}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}

function FichaMaestro({ dato }: { dato?: ConfiguracionGeneralResponse }) {
  if (!dato) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Ficha de configuración</CardTitle>
          <CardDescription>Selecciona un registro de la tabla.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Ficha de configuración</CardTitle>
        <CardDescription>Lectura del registro seleccionado por negocio.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              {dato.tipoDatoMaestro}
            </p>
            <h3 className="text-lg font-semibold">{dato.nombre}</h3>
          </div>
          <EstadoDatoBadge dato={dato} />
        </div>
        <Separator />
        <div className="grid gap-3">
          <Dato label="Codigo" value={dato.codigo} />
          <Dato label="Descripcion" value={dato.descripcion} />
          <Dato
            label={etiquetaDetalleEspecifico(dato.tipoDatoMaestro)}
            value={detalleEspecifico(dato)}
          />
          <Dato label="Creacion" value={formatearFecha(dato.fechaCreacion)} />
          <Dato label="Usuario creacion" value={dato.usuarioCreacion} />
          <Dato label="Ultimo evento" value={eventoPrincipal(dato)} />
          <Dato label="Modificacion" value={formatearFecha(dato.fechaModificacion)} />
          {dato.motivoInhabilitacion ? (
            <Dato label="Motivo inhabilitacion" value={dato.motivoInhabilitacion} />
          ) : null}
          {dato.motivoAnulacion ? <Dato label="Motivo anulacion" value={dato.motivoAnulacion} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguracionGeneralDashboardVista() {
  const query = useConfiguracionGeneralQuery({
    page: 1,
    pageSize: 6,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const estadoQuery = useEstadoBcConfiguracionGeneralQuery()
  const datos = query.data?.datos ?? []
  const total = query.data?.paginacion?.total ?? datos.length

  return (
    <>
      <SiteHeader
        title="CS-Configuración General"
        breadcrumbs={[{ title: "CS-Configuración General" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {query.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la información</AlertTitle>
              <AlertDescription>{obtenerMensajeError(query.error)}</AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={query.isLoading} />

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Configuraciones recientes</h2>
                  <p className="text-sm text-muted-foreground">
                    Consulta real de Cargo, Sede, Area, Cuenta y Contrato.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/configuracion/listar">Ver listado</Link>
                </Button>
              </div>
              <TablaDatosMaestros datos={datos} cargando={query.isLoading} />
            </section>

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Estado del servicio</CardTitle>
                  <CardDescription>Disponibilidad actual del servicio de configuración.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <Dato
                    label="Conexión"
                    value={
                      estadoQuery.isLoading
                        ? "Verificando"
                        : estadoQuery.error
                          ? "No disponible"
                          : "Disponible"
                    }
                  />
                  <Dato label="Uso" value="Cargos, sedes, areas, cuentas y contratos" />
                </CardContent>
              </Card>
              <ConteoPorTipo datos={datos} />
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>Operaciones frecuentes del modulo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/configuracion/nuevo">
                      <Plus className="size-4" />
                      Registrar configuración
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/configuracion/reportes">
                      <FileDown className="size-4" />
                      Ver reportes
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/configuracion/listar">
                      <Database className="size-4" />
                      Ver configuraciones
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralListadoVista() {
  const [query, setQuery] = useState<ConsultarConfiguracionGeneralQuery>({
    page: 1,
    pageSize: 20,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const consulta = useConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, false)
  const datos = consulta.data?.datos ?? []
  const total = consulta.data?.paginacion?.total ?? datos.length
  const [seleccionado, setSeleccionado] = useState<ConfiguracionGeneralResponse | undefined>()
  const seleccionActual = seleccionado && datos.some((dato) => dato.id === seleccionado.id)
    ? seleccionado
    : datos[0]

  async function exportar() {
    await exportacion.refetch()
  }

  return (
    <>
      <SiteHeader
        title="Configuraciones"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Configuraciones" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {consulta.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la información</AlertTitle>
              <AlertDescription>{obtenerMensajeError(consulta.error)}</AlertDescription>
            </Alert>
          ) : null}

          {exportacion.data ? (
            <Alert>
              <AlertTitle>Exportacion consultada</AlertTitle>
              <AlertDescription>
                Se encontraron {exportacion.data.datos.length} registros para exportar.
              </AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={consulta.isLoading} />

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold">Configuraciones registradas</h2>
                <p className="text-sm text-muted-foreground">
                  Consulta por tipo, estado y vigencia de los registros disponibles.
                </p>
              </div>
              <FiltrosMaestros
                query={query}
                setQuery={setQuery}
                onExportar={() => void exportar()}
                exportando={exportacion.isFetching}
              />
              <TablaDatosMaestros
                datos={datos}
                cargando={consulta.isLoading}
                onSelect={setSeleccionado}
              />
            </section>

            <aside className="flex flex-col gap-3">
              <FichaMaestro dato={seleccionActual} />
              <ConteoPorTipo datos={datos} />
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralNuevoVista() {
  const { usuario } = useSesion()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tipoNuevo, setTipoNuevo] = useState<TipoDatoMaestro>("CARGO")
  const [nivelAreaNuevo, setNivelAreaNuevo] = useState<NivelArea>("AREA")
  const [paisNuevo, setPaisNuevo] = useState("Peru")
  const [departamentoNuevo, setDepartamentoNuevo] = useState("")
  const [provinciaNuevo, setProvinciaNuevo] = useState("")
  const [distritoNuevo, setDistritoNuevo] = useState("")
  const ejemplos = ejemplosFormulario(tipoNuevo)
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
  const registrarMutation = useRegistrarConfiguracionGeneralMutation()

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje(null)
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const cargoSuperiorId = valorOpcional(formData, "cargoSuperiorId")
    const direccion = valorOpcional(formData, "direccion")
    const pais = valorOpcional(formData, "pais")
    const departamento = valorOpcional(formData, "departamento")
    const provincia = valorOpcional(formData, "provincia")
    const ciudad = valorOpcional(formData, "ciudad")
    const distrito = valorOpcional(formData, "distrito")
    const referenciaUbicacion = valorOpcional(formData, "referenciaUbicacion")
    const sedeId = valorOpcional(formData, "sedeId")
    const nivelArea = valorOpcional(formData, "nivelArea") as NivelArea | undefined
    const gerenciaId = valorOpcional(formData, "gerenciaId")
    const tipoCuenta = valorOpcional(formData, "tipoCuenta")
    const tipoContrato = valorOpcional(formData, "tipoContrato")
    const cuentaId = valorOpcional(formData, "cuentaId")

    if (tipoNuevo === "AREA") {
      if (!sedeId) {
        setError("Selecciona la sede a la que pertenece el area.")
        return
      }

      if (nivelArea === "AREA" && !gerenciaId) {
        setError("Selecciona la gerencia superior del area.")
        return
      }
    }

    if (tipoNuevo === "SEDE" && (!pais || !direccion || !departamento || !provincia || !distrito)) {
      setError("Completa pais, direccion, departamento, provincia y distrito de la sede.")
      return
    }

    try {
      const creado = await registrarMutation.mutateAsync({
        tipoDatoMaestro: tipoNuevo,
        codigo: String(formData.get("codigo") ?? "").trim(),
        nombre: String(formData.get("nombre") ?? "").trim(),
        descripcion: valorOpcional(formData, "descripcion") ?? null,
        ...(tipoNuevo === "CARGO" ? { cargoSuperiorId: cargoSuperiorId ?? null } : {}),
        ...(tipoNuevo === "SEDE"
          ? {
              direccion: direccion ?? null,
              pais: pais ?? null,
              departamento: departamento ?? null,
              provincia: provincia ?? null,
              ciudad: ciudad ?? null,
              distrito: distrito ?? null,
              referenciaUbicacion: referenciaUbicacion ?? null,
            }
          : {}),
        ...(tipoNuevo === "AREA"
          ? {
              sedeId: sedeId ?? null,
              nivelArea: nivelArea ?? null,
              gerenciaId: nivelArea === "AREA" ? gerenciaId ?? null : null,
            }
          : {}),
        ...(tipoNuevo === "CUENTA" ? { tipoCuenta } : {}),
        ...(tipoNuevo === "CONTRATO" ? { tipoContrato, cuentaId: cuentaId ?? null } : {}),
        usuarioCreacion: usuario?.email ?? "admin",
      })
      form.reset()
      setTipoNuevo("CARGO")
      setNivelAreaNuevo("AREA")
      setPaisNuevo("Peru")
      setDepartamentoNuevo("")
      setProvinciaNuevo("")
      setDistritoNuevo("")
      setMensaje(`${creado.tipoDatoMaestro} ${creado.codigo} fue registrado.`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <SiteHeader
        title="Nueva configuración"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Nueva configuración" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
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

          <section>
            <form
              className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
              onSubmit={(event) => void registrar(event)}
            >
              <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">Registrar configuración</h2>
                    <p className="text-sm text-muted-foreground">
                      Completa la informacion que usaran las areas para clasificar cargos,
                      sedes, areas, cuentas y contratos.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full">
                    Activo al guardar
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  El registro quedara disponible para seleccionarse en los procesos relacionados.
                </p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="tipoDatoMaestro">Tipo de configuración</label>
                  <Select
                    value={tipoNuevo}
                    onValueChange={(value) => {
                      setTipoNuevo(value as TipoDatoMaestro)
                      setNivelAreaNuevo("AREA")
                      setPaisNuevo("Peru")
                      setDepartamentoNuevo("")
                      setProvinciaNuevo("")
                      setDistritoNuevo("")
                    }}
                  >
                    <SelectTrigger id="tipoDatoMaestro" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARGO">Cargo</SelectItem>
                      <SelectItem value="SEDE">Sede</SelectItem>
                      <SelectItem value="AREA">Area</SelectItem>
                      <SelectItem value="CUENTA">Cuenta</SelectItem>
                      <SelectItem value="CONTRATO">Contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="codigo">Codigo</label>
                  <Input id="codigo" name="codigo" placeholder={ejemplos.codigo} required />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="nombre">Nombre</label>
                  <Input id="nombre" name="nombre" placeholder={ejemplos.nombre} required />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="descripcion">Descripcion</label>
                  <Textarea id="descripcion" name="descripcion" placeholder={ejemplos.descripcion} />
                </div>
                <CamposEspecificosMaestro
                  areas={areasQuery.data?.datos ?? []}
                  cargos={cargosQuery.data?.datos ?? []}
                  cuentas={cuentasQuery.data?.datos ?? []}
                  departamento={departamentoNuevo}
                  distrito={distritoNuevo}
                  nivelArea={nivelAreaNuevo}
                  onNivelAreaChange={setNivelAreaNuevo}
                  onUbicacionChange={(ubicacion) => {
                    if (ubicacion.pais !== undefined) setPaisNuevo(ubicacion.pais)
                    if (ubicacion.departamento !== undefined) setDepartamentoNuevo(ubicacion.departamento)
                    if (ubicacion.provincia !== undefined) setProvinciaNuevo(ubicacion.provincia)
                    if (ubicacion.distrito !== undefined) setDistritoNuevo(ubicacion.distrito)
                  }}
                  pais={paisNuevo}
                  provincia={provinciaNuevo}
                  sedes={sedesQuery.data?.datos ?? []}
                  tipo={tipoNuevo}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
                <Button asChild variant="outline">
                  <Link href="/configuracion/listar">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={registrarMutation.isPending}>
                  <CheckCircle2 className="size-4" />
                  {registrarMutation.isPending ? "Guardando..." : "Guardar configuración"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralReportesVista() {
  const [query] = useState<ConsultarConfiguracionGeneralQuery>({
    page: 1,
    pageSize: 50,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const catalogo = useCatalogoConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, true)
  const datos = exportacion.data?.datos ?? catalogo.data?.datos ?? []
  const total = exportacion.data?.paginacion?.total ?? datos.length
  const disponibles = datos.filter(
    (dato) => dato.estado === "ACTIVO" && dato.estadoRegistro === "ACTIVO",
  ).length
  const pausadas = datos.filter(
    (dato) => dato.estado === "INACTIVO" && dato.estadoRegistro !== "ANULADO",
  ).length
  const retiradas = datos.filter((dato) => dato.estadoRegistro === "ANULADO").length
  const resumen = [
    {
      titulo: "Disponibles",
      valor: disponibles,
      detalle: "Listas para usarse en los procesos del sistema.",
      icon: CheckCircle2,
    },
    {
      titulo: "Pausadas",
      valor: pausadas,
      detalle: "Se conservan en consulta, pero no se usan para nuevas operaciones.",
      icon: Ban,
    },
    {
      titulo: "Retiradas",
      valor: retiradas,
      detalle: "Quedan como referencia historica y no aparecen como opciones activas.",
      icon: History,
    },
  ]

  return (
    <>
      <SiteHeader
        title="Reportes"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Reportes" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {exportacion.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la información</AlertTitle>
              <AlertDescription>{obtenerMensajeError(exportacion.error)}</AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={exportacion.isLoading} />

          <section className="grid gap-3 md:grid-cols-3">
            {resumen.map((item) => (
              <Card key={item.titulo} className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardDescription>{item.titulo}</CardDescription>
                    <CardTitle className="mt-2 text-3xl tabular-nums">
                      {exportacion.isLoading ? "-" : item.valor}
                    </CardTitle>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                    <item.icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.detalle}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section>
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Configuraciones para revisar</h2>
                  <p className="text-sm text-muted-foreground">
                    Vista consolidada de cargos, sedes, areas, cuentas y contratos.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void exportacion.refetch()}>
                  <FileDown className="size-4" />
                  Actualizar
                </Button>
              </div>
              <TablaDatosMaestros datos={datos} cargando={exportacion.isLoading} />
            </section>
          </section>
        </div>
      </main>
    </>
  )
}
