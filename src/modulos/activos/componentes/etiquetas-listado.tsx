"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Plus, QrCode } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
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
import { Textarea } from "@/compartido/componentes/ui/textarea";
import type { Etiqueta, EstadoEtiqueta } from "../tipos/etiquetas.tipos";
import {
  useEtiquetasQuery,
  useGenerarEtiquetasMutation,
} from "../servicios/etiquetas-queries";

const ETIQUETAS_BADGE_VARIANTE: Record<
  EstadoEtiqueta,
  "default" | "secondary" | "destructive" | "outline"
> = {
  GENERADA: "outline",
  ASIGNADA: "default",
  REEMPLAZADA: "secondary",
  ANULADA: "destructive",
};

const ETIQUETAS_BADGE_TEXTO: Record<EstadoEtiqueta, string> = {
  GENERADA: "Generada",
  ASIGNADA: "Asignada",
  REEMPLAZADA: "Reemplazada",
  ANULADA: "Anulada",
};

// ---------------------------------------------------------------------------
// Sheet — Generar lote de etiquetas
// ---------------------------------------------------------------------------

function DialogGenerarEtiquetas({
  abierto,
  onCerrar,
  onGenerado,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGenerado: (creadas: Etiqueta[]) => void;
}) {
  const [cantidad, setCantidad] = useState("1");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generar = useGenerarEtiquetasMutation({
    onSuccess: (creadas) => {
      setError(null);
      setCantidad("1");
      setObservacion("");
      onGenerado(creadas);
      onCerrar();
    },
    onError: (err) => setError(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setCantidad("1");
      setObservacion("");
      onCerrar();
    }
  }

  const cantidadNumero = Number(cantidad);
  const valido =
    Number.isInteger(cantidadNumero) && cantidadNumero >= 1 && cantidadNumero <= 500;

  function handleConfirmar() {
    if (!valido) return;
    setError(null);
    generar.mutate({
      cantidad: cantidadNumero,
      observacion: observacion.trim() || undefined,
    });
  }

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Generar lote de etiquetas QR</SheetTitle>
          <SheetDescription>
            Crea etiquetas nuevas sin asignar. Cada una recibe un codigo correlativo y un
            QR unico listo para imprimir.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo generar el lote</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-cantidad">Cantidad</Label>
              <Input
                id="form-cantidad"
                type="number"
                min={1}
                max={500}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 10"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Entre 1 y 500 etiquetas por lote.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-observacion">Observacion (opcional)</Label>
              <Textarea
                id="form-observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej. Lote impresion enero"
                rows={2}
              />
            </div>
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={generar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button onClick={handleConfirmar} disabled={generar.isPending || !valido}>
            {generar.isPending ? "Generando..." : "Generar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Sheet — Resultado del lote generado
// ---------------------------------------------------------------------------

function DialogLoteGenerado({
  creadas,
  onCerrar,
}: {
  creadas: Etiqueta[] | null;
  onCerrar: () => void;
}) {
  return (
    <Sheet open={creadas !== null} onOpenChange={(open) => !open && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Lote generado</SheetTitle>
          <SheetDescription>
            {creadas?.length ?? 0} {creadas?.length === 1 ? "etiqueta creada" : "etiquetas creadas"}.
            Listas para imprimir y pegar en la unidad.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-4">
            {(creadas ?? []).map((etiqueta) => (
              <Card key={etiqueta.id}>
                <CardContent className="flex items-center gap-4 pt-5">
                  <div className="rounded-lg border border-border bg-white p-2">
                    <QRCodeSVG value={etiqueta.contenidoQr} size={64} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{etiqueta.codigo}</span>
                    <span className="text-xs text-muted-foreground break-all">
                      {etiqueta.contenidoQr}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" onClick={onCerrar}>
              Cerrar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function EtiquetasListado() {
  const [estadoFiltro, setEstadoFiltro] = useState<"TODOS" | EstadoEtiqueta>("TODOS");
  const [asignacionFiltro, setAsignacionFiltro] = useState<"TODOS" | "true" | "false">(
    "TODOS"
  );

  const consulta = useEtiquetasQuery({
    estado: estadoFiltro === "TODOS" ? undefined : estadoFiltro,
  });
  const etiquetas = consulta.data ?? [];
  const etiquetasFiltradas =
    asignacionFiltro === "TODOS"
      ? etiquetas
      : etiquetas.filter((e) => String(e.asignada) === asignacionFiltro);

  const [dialogGenerarAbierto, setDialogGenerarAbierto] = useState(false);
  const [loteGenerado, setLoteGenerado] = useState<Etiqueta[] | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Etiquetas QR</h2>
          <p className="text-sm text-muted-foreground">
            {etiquetasFiltradas.length}{" "}
            {etiquetasFiltradas.length === 1 ? "etiqueta" : "etiquetas"}
          </p>
        </div>
        <Button onClick={() => setDialogGenerarAbierto(true)}>
          <Plus />
          Generar lote
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          {consulta.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la informacion</AlertTitle>
              <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-40 gap-1.5">
              <Select
                value={estadoFiltro}
                onValueChange={(v) => setEstadoFiltro(v as typeof estadoFiltro)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Estado: Todos</SelectItem>
                  <SelectItem value="GENERADA">Generada</SelectItem>
                  <SelectItem value="ASIGNADA">Asignada</SelectItem>
                  <SelectItem value="REEMPLAZADA">Reemplazada</SelectItem>
                  <SelectItem value="ANULADA">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-44 gap-1.5">
              <Select
                value={asignacionFiltro}
                onValueChange={(v) => setAsignacionFiltro(v as typeof asignacionFiltro)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Asignacion: Todas</SelectItem>
                  <SelectItem value="true">Con activo</SelectItem>
                  <SelectItem value="false">Sin activo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%] text-center">QR</TableHead>
                  <TableHead className="w-[18%]">Codigo</TableHead>
                  <TableHead className="w-[16%]">Estado</TableHead>
                  <TableHead className="w-[30%]">Activo asignado</TableHead>
                  <TableHead className="w-[26%]">Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : etiquetasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      No hay etiquetas para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  etiquetasFiltradas.map((etiqueta) => (
                    <TableRow key={etiqueta.id}>
                      <TableCell className="text-center">
                        <QrCode className="mx-auto size-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="truncate text-sm font-medium">
                        <Link
                          href={`/activos/etiquetas/${etiqueta.id}`}
                          className="hover:underline"
                        >
                          {etiqueta.codigo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ETIQUETAS_BADGE_VARIANTE[etiqueta.estado]}>
                          {ETIQUETAS_BADGE_TEXTO[etiqueta.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate text-sm text-muted-foreground">
                        {etiqueta.activo
                          ? `${etiqueta.activo.codigo} · ${etiqueta.activo.descripcion}`
                          : "Sin asignacion"}
                      </TableCell>
                      <TableCell className="truncate text-sm text-muted-foreground">
                        {new Date(etiqueta.fechaCreacion).toLocaleString("es-PE")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DialogGenerarEtiquetas
        abierto={dialogGenerarAbierto}
        onCerrar={() => setDialogGenerarAbierto(false)}
        onGenerado={(creadas) => setLoteGenerado(creadas)}
      />
      <DialogLoteGenerado creadas={loteGenerado} onCerrar={() => setLoteGenerado(null)} />
    </section>
  );
}
