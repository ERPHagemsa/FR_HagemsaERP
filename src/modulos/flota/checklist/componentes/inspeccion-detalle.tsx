"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleDot } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { useInspeccionQuery } from "../servicios/inspecciones-queries";
import type {
  EstadoItem,
  InspeccionItem,
  InspeccionNeumatico,
} from "../tipos/inspeccion.tipos";

function BadgeEstadoItem({ estado }: { estado: EstadoItem }) {
  const config: Record<EstadoItem, { label: string; clase: string }> = {
    SIN_RESPONDER: { label: "Sin responder", clase: "text-muted-foreground" },
    CONFORME: { label: "Conforme", clase: "text-emerald-600 dark:text-emerald-400" },
    NO_CONFORME: { label: "No conforme", clase: "text-destructive" },
    NO_APLICA: { label: "No aplica", clase: "text-muted-foreground" },
  };
  const { label, clase } = config[estado];
  return <span className={`text-sm font-medium ${clase}`}>{label}</span>;
}

// Muestra el valor capturado de un ítem según su tipo de respuesta (read-only).
function ValorItem({ item }: { item: InspeccionItem }) {
  switch (item.tipoRespuesta) {
    case "CONFORMIDAD":
      return <BadgeEstadoItem estado={item.estadoItem} />;
    case "MEDICION":
      return (
        <span className="text-sm">
          {item.valorNumerico ?? "—"}
          {item.valorNumerico != null && item.unidad ? ` ${item.unidad}` : ""}
        </span>
      );
    case "BOOLEANO":
      return (
        <span className="text-sm">
          {item.valorBooleano == null ? "—" : item.valorBooleano ? "Sí" : "No"}
        </span>
      );
    case "SELECCION":
    case "TEXTO":
      return <span className="text-sm">{item.valorTexto || "—"}</span>;
    default:
      return <span className="text-sm">—</span>;
  }
}

function DatoOperacion({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-medium">{valor ?? "—"}</span>
    </div>
  );
}

export function InspeccionDetalle({ inspeccionId }: { inspeccionId: string }) {
  const router = useRouter();
  const consulta = useInspeccionQuery(inspeccionId);
  const inspeccion = consulta.data;

  const neumaticosPorGrupo = useMemo(() => {
    const grupos = new Map<string, InspeccionNeumatico[]>();
    for (const n of inspeccion?.neumaticos ?? []) {
      const arr = grupos.get(n.grupo) ?? [];
      arr.push(n);
      grupos.set(n.grupo, arr);
    }
    for (const arr of grupos.values()) arr.sort((a, b) => a.orden - b.orden);
    return [...grupos.entries()];
  }, [inspeccion]);

  if (consulta.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (consulta.error || !inspeccion) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la inspección</AlertTitle>
        <AlertDescription>
          {consulta.error ? extraerMensajeError(consulta.error) : "No encontrada."}
        </AlertDescription>
      </Alert>
    );
  }

  const secciones = [...inspeccion.secciones].sort((a, b) => a.orden - b.orden);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/flota/checklist/inspecciones")}>
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>
        <Badge variant={inspeccion.estado === "CONFIRMADA" ? "default" : "secondary"}>
          {inspeccion.estado}
        </Badge>
      </div>

      {/* Cabecera */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            Inspección {inspeccion.codigo ? `#${inspeccion.codigo}` : ""}
            {inspeccion.vehiculoPlaca ? ` — ${inspeccion.vehiculoPlaca}` : ""}
          </CardTitle>
          <CardDescription>
            {inspeccion.tipoChecklist?.nombre ?? "Tipo de checklist"} · estructura resuelta
            automáticamente por la carrocería de la unidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-5 sm:grid-cols-4">
          <DatoOperacion etiqueta="Horómetro" valor={inspeccion.horometro} />
          <DatoOperacion etiqueta="Hubodómetro" valor={inspeccion.hubodometro} />
          <DatoOperacion etiqueta="Kilometraje" valor={inspeccion.kilometraje} />
          <DatoOperacion etiqueta="Destino" valor={inspeccion.destino} />
          <DatoOperacion
            etiqueta="Color de rotulación"
            valor={
              inspeccion.colorRotulacion?.nombre ? (
                <span className="inline-flex items-center gap-1.5">
                  {inspeccion.colorRotulacion.valorHex ? (
                    <span
                      className="inline-block size-3 rounded-sm border border-border/50"
                      style={{ backgroundColor: inspeccion.colorRotulacion.valorHex }}
                    />
                  ) : null}
                  {inspeccion.colorRotulacion.nombre}
                </span>
              ) : null
            }
          />
          <div className="col-span-2 sm:col-span-4">
            <DatoOperacion etiqueta="Observaciones" valor={inspeccion.observaciones} />
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Vista de solo lectura</AlertTitle>
        <AlertDescription>
          La captura editable (responder ítems, cocadas de neumáticos, autoguardado y
          confirmación) llega en la siguiente historia.
        </AlertDescription>
      </Alert>

      {/* Secciones e ítems */}
      {secciones.map((seccion) => (
        <Card key={seccion.id}>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">{seccion.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Ítem</TableHead>
                    <TableHead className="w-[25%]">Respuesta</TableHead>
                    <TableHead className="w-[12%]">Cantidad</TableHead>
                    <TableHead className="w-[18%]">Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...seccion.items]
                    .sort((a, b) => a.orden - b.orden)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {item.etiqueta}
                          {item.requerido ? (
                            <span className="ml-1 text-destructive">*</span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <ValorItem item={item} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.capturaCantidad ? (item.cantidad ?? "—") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.observacion || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Neumáticos */}
      {neumaticosPorGrupo.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDot className="size-4" />
              Neumáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-4">
            {neumaticosPorGrupo.map(([grupo, neumaticos]) => (
              <div key={grupo} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">{grupo}</span>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posición</TableHead>
                        <TableHead>Cocada (mm)</TableHead>
                        <TableHead>Otro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {neumaticos.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="text-sm font-medium">{n.posicion}</TableCell>
                          <TableCell className="text-sm">{n.cocadaMm ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {n.otro || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Separator />
    </div>
  );
}
