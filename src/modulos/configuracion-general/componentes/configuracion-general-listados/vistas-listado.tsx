"use client"

import { Badge } from "@/compartido/componentes/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { cn } from "@/compartido/utilidades/utils"

import type { ConfiguracionGeneralResponse } from "../../tipos/configuracion-general"
import { AccionesConfiguracion } from "./acciones-configuracion"
import {
  construirJerarquia,
  type NodoJerarquia,
  relacionResumen,
} from "./jerarquia"
import {
  columnasPorTipo,
  formatearFecha,
  IconoGrupo,
  obtenerClaseContenido,
  obtenerClaseFila,
  type TipoJerarquico,
  type TipoListado,
  textoEstado,
  varianteEstado,
} from "./utilidades"

function NodoJerarquiaCard({
  nodo,
  profundidad,
  onActualizado,
  onError,
  onMensaje,
}: {
  nodo: NodoJerarquia
  profundidad: number
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  const dato = nodo.dato
  const relacion = dato ? relacionResumen(dato) : null

  return (
    <div className={cn("relative", profundidad > 0 && "pl-5 md:pl-8")}>
      {profundidad > 0 ? (
        <span className="absolute left-0 top-6 h-px w-4 bg-border md:w-6" aria-hidden />
      ) : null}

      {dato ? (
        // Registro real (sede, area, almacen, cargo, contrato): tarjeta con
        // acciones y la frase de a que pertenece.
        <Card size="sm">
          <CardHeader>
            <CardTitle className={cn("text-base", obtenerClaseContenido(dato))}>
              {nodo.titulo}
            </CardTitle>
            <CardDescription>
              {relacion ?? nodo.descripcion}
            </CardDescription>
            <CardAction>
              <AccionesConfiguracion
                dato={dato}
                onActualizado={onActualizado}
                onError={onError}
                onMensaje={onMensaje}
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{nodo.etiqueta}</Badge>
            <Badge variant={varianteEstado(dato)}>{textoEstado(dato)}</Badge>
            <Badge variant="outline" className="font-mono">{dato.codigo}</Badge>
            {nodo.hijos.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {nodo.hijos.length}{" "}
                {nodo.hijos.length === 1 ? "elemento dentro" : "elementos dentro"}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        // Cabecera de grupo (contenedor que NO es un registro editable, p. ej. la
        // ubicacion que agrupa sedes, o la sede que agrupa areas).
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
            <IconoGrupo etiqueta={nodo.etiqueta} className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {nodo.etiqueta}
            </p>
            <p className="truncate font-semibold leading-tight">{nodo.titulo}</p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">
            {nodo.hijos.length} {nodo.hijos.length === 1 ? "elemento" : "elementos"}
          </Badge>
        </div>
      )}

      {nodo.hijos.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3 border-l border-border/70 pl-3 md:pl-4">
          {nodo.hijos.map((hijo) => (
            <NodoJerarquiaCard
              key={hijo.clave}
              nodo={hijo}
              profundidad={profundidad + 1}
              onActualizado={onActualizado}
              onError={onError}
              onMensaje={onMensaje}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function VistaJerarquicaConfiguracion({
  cargando,
  datos,
  tipo,
  onActualizado,
  onError,
  onMensaje,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  tipo: TipoJerarquico
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="ml-10 h-28 w-[calc(100%-2.5rem)]" />
        <Skeleton className="ml-20 h-28 w-[calc(100%-5rem)]" />
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No existen registros para la consulta aplicada.
      </div>
    )
  }

  const nodos = construirJerarquia(tipo, datos)

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
        <Badge variant="secondary">Vista por niveles</Badge>
        <span className="text-sm text-muted-foreground">
          Las barras grises agrupan; las tarjetas son los registros y muestran a que pertenecen.
        </span>
      </div>
      <div className="flex flex-col gap-5">
        {nodos.map((nodo) => (
          <NodoJerarquiaCard
            key={nodo.clave}
            nodo={nodo}
            profundidad={0}
            onActualizado={onActualizado}
            onError={onError}
            onMensaje={onMensaje}
          />
        ))}
      </div>
    </div>
  )
}

export function TablaListadoConfiguracion({
  cargando,
  datos,
  tipo,
  onActualizado,
  onError,
  onMensaje,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  tipo: TipoListado
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  const columnas = columnasPorTipo[tipo]

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
      <div className="p-6 text-sm text-muted-foreground">
        No existen registros para la consulta aplicada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">Acciones</TableHead>
            <TableHead className="w-16 text-right">#</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            {columnas.map((columna) => (
              <TableHead key={columna.header} className={columna.className}>
                {columna.header}
              </TableHead>
            ))}
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Actualizacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => {
            const claseContenido = obtenerClaseContenido(dato)

            return (
              <TableRow
                key={`${dato.tipoDatoMaestro}-${dato.id}`}
                className={obtenerClaseFila(dato)}
              >
                <TableCell>
                  <AccionesConfiguracion
                    dato={dato}
                    onActualizado={onActualizado}
                    onError={onError}
                    onMensaje={onMensaje}
                  />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  <span className={claseContenido}>{dato.id}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className={claseContenido}>{dato.codigo}</span>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-56 flex-col">
                    <span className={cn("font-medium", claseContenido)}>{dato.nombre}</span>
                    <span className="text-xs text-muted-foreground">{dato.descripcion || "Sin descripcion"}</span>
                  </div>
                </TableCell>
                {columnas.map((columna) => (
                  <TableCell key={columna.header} className={columna.className}>
                    <span className={claseContenido}>{columna.render(dato)}</span>
                  </TableCell>
                ))}
                <TableCell>
                  <Badge variant={varianteEstado(dato)}>{textoEstado(dato)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={dato.estadoRegistro === "ANULADO" ? "destructive" : "outline"}>
                    {dato.estadoRegistro === "ANULADO" ? "Anulado" : "Vigente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-40 flex-col">
                    <span className={claseContenido}>
                      {formatearFecha(dato.fechaModificacion || dato.fechaCreacion)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dato.usuarioModificacion || dato.usuarioCreacion}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
