"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { useConsulta } from "@/compartido/api/use-consulta"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
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
import { CLAVE_TARIFARIOS } from "@/modulos/comercial/claves-consulta"
import { useModalidadesQuery } from "@/modulos/comercial/catalogos/modalidades/servicios/catalogo-modalidades-queries"
import { useConsultarCotizacion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries"
import { listarTarifarios } from "@/modulos/comercial/tarifarios/servicios/tarifarios-api"

import {
  useContratoDetalleQuery,
  useTarifarioConsolidadoQuery,
} from "../servicios/contratos-queries"
import { etiquetaEstadoContrato } from "../tipos/contratos.tipos"

function formatearFecha(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE")
}

interface Props {
  idContrato: string
}

export function ContratoDetalle({ idContrato }: Props) {
  const consulta = useContratoDetalleQuery(idContrato)
  const contrato = consulta.data

  const modalidadesQuery = useModalidadesQuery({ estado: "ACTIVA", porPagina: 200 })
  const nombreModalidad = (id: string) =>
    (modalidadesQuery.data?.data ?? []).find((m) => m.id === id)?.nombre ?? id

  // Tarifario(s) generados para este contrato (Tarifario.idContrato).
  const tarifariosQuery = useConsulta(
    () => listarTarifarios({ idContrato, porPagina: 50 }),
    [idContrato],
    { enabled: Boolean(idContrato), clave: CLAVE_TARIFARIOS },
  )
  const tarifarios = tarifariosQuery.data?.data ?? []

  // Tarifario consolidado del cliente (HU-03-025).
  const consolidadoQuery = useTarifarioConsolidadoQuery(
    contrato?.idClienteExterno ?? "",
  )
  // El backend responde { tarifas, cargos } (antes era un array plano).
  const tarifasConsolidadas = consolidadoQuery.data?.tarifas ?? []
  const cargosConsolidados = consolidadoQuery.data?.cargos ?? []

  // Código de la cotización origen (COT-AAAA-NNNNN) en vez del UUID.
  const cotizacionOrigenQuery = useConsultarCotizacion(
    contrato?.idCotizacionOrigen ?? "",
  )
  const codigoCotizacionOrigen =
    cotizacionOrigenQuery.data?.codigoCotizacion ?? null

  if (consulta.isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (consulta.error || !contrato) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar el contrato</AlertTitle>
        <AlertDescription>
          {consulta.error ? extraerMensajeError(consulta.error) : "No encontrado."}
        </AlertDescription>
      </Alert>
    )
  }

  const activo = contrato.estado === "ACTIVO"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/comercial/contratos">
            <ArrowLeft />
            Contratos
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{contrato.codigoContrato ?? "Contrato"}</CardTitle>
            <Badge variant={activo ? "default" : "secondary"}>
              {etiquetaEstadoContrato(contrato.estado)}
            </Badge>
          </div>
          <CardDescription>
            Cliente {contrato.nombreClienteExterno ?? contrato.idClienteExterno}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 pt-5 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Vigencia</p>
            <p>
              {formatearFecha(contrato.vigenciaInicio)}
              {" → "}
              {formatearFecha(contrato.vigenciaFin)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cotizacion origen</p>
            <p className="truncate">
              {!contrato.idCotizacionOrigen
                ? "—"
                : (codigoCotizacionOrigen ??
                  (cotizacionOrigenQuery.isLoading
                    ? "Cargando…"
                    : contrato.idCotizacionOrigen))}
            </p>
          </div>
          {contrato.contratoOrigenId ? (
            <div>
              <p className="text-xs text-muted-foreground">Contrato origen</p>
              <Link
                href={`/comercial/contratos/${contrato.contratoOrigenId}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Ver contrato anterior
              </Link>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-muted-foreground">Creado</p>
            <p>{formatearFecha(contrato.fechaCreacion)}</p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs text-muted-foreground">PDF firmado</p>
            <p>
              {contrato.pdf
                ? `${contrato.pdf.nombre} · ${formatearFecha(contrato.pdf.fechaCarga)}`
                : "Sin PDF firmado"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Tarifario del contrato</CardTitle>
              <CardDescription>
                Tarifario del que nacio este contrato.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {tarifariosQuery.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : tarifarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este contrato no tiene tarifario asociado.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {tarifarios.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={t.estado === "VIGENTE" ? "default" : "secondary"}>
                      {t.estado === "VIGENTE" ? "Vigente" : "Anulado"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {t.moneda} · {t.cantidadTarifas}{" "}
                      {t.cantidadTarifas === 1 ? "tarifa" : "tarifas"}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/comercial/tarifarios/${t.id}`}>
                      Ver tarifario
                      <ExternalLink />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">
            Tarifario consolidado del cliente
          </CardTitle>
          <CardDescription>
            Union de las tarifas de los contratos vigentes del cliente
            (HU-03-025).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {consolidadoQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : consolidadoQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar el consolidado</AlertTitle>
              <AlertDescription>
                {extraerMensajeError(consolidadoQuery.error)}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-5">
            <div className="overflow-hidden rounded-xl border border-border">
              <Table className="w-full [&_td]:px-2 [&_th]:px-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Vehiculo</TableHead>
                    <TableHead>Condicion</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Standby</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarifasConsolidadas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        El cliente no tiene tarifas vigentes consolidadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tarifasConsolidadas.map((t, i) => (
                      <TableRow key={`${t.idTarifario}-${i}`}>
                        <TableCell className="text-sm">
                          {nombreModalidad(t.idModalidad)}
                        </TableCell>
                        <TableCell className="text-sm">{t.origen ?? "—"}</TableCell>
                        <TableCell className="text-sm">{t.destino ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {t.tipoVehiculo ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.condicion ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {t.moneda} {t.precio.toLocaleString("es-PE")}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {t.tarifaStandbyDia != null
                            ? t.tarifaStandbyDia.toLocaleString("es-PE")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Cargos adicionales
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table className="w-full [&_td]:px-2 [&_th]:px-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Condicion</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Standby</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargosConsolidados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-24 text-center text-muted-foreground"
                        >
                          El cliente no tiene cargos vigentes consolidados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cargosConsolidados.map((c, i) => (
                        <TableRow key={`${c.idTarifario}-cargo-${i}`}>
                          <TableCell className="text-sm">{c.concepto}</TableCell>
                          <TableCell className="text-sm">
                            {nombreModalidad(c.idModalidad)}
                          </TableCell>
                          <TableCell className="text-sm">{c.origen ?? "—"}</TableCell>
                          <TableCell className="text-sm">{c.destino ?? "—"}</TableCell>
                          <TableCell className="text-sm">{c.unidadCobro}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.condicion ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {c.moneda} {c.precio.toLocaleString("es-PE")}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {c.tarifaStandbyDia != null
                              ? c.tarifaStandbyDia.toLocaleString("es-PE")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
