"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, ClipboardList, Eye } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";
import type {
  EstadoInspeccion,
  FiltrosInspecciones,
  InspeccionResumen,
} from "../tipos/inspeccion.tipos";
import type { EstadoRegistroChecklist } from "../tipos/checklist.tipos";
import {
  useAnularInspeccionMutation,
  useInspeccionesQuery,
} from "../servicios/inspecciones-queries";

const ETIQUETA_ESTADO: Record<EstadoInspeccion, string> = {
  BORRADOR: "Borrador",
  COMPLETA: "Completa",
  CONFIRMADA: "Confirmada",
};

function BadgeEstado({ estado }: { estado: EstadoInspeccion }) {
  const variante =
    estado === "CONFIRMADA" ? "default" : estado === "COMPLETA" ? "secondary" : "outline";
  return <Badge variant={variante}>{ETIQUETA_ESTADO[estado]}</Badge>;
}

function formatoFecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-PE");
}

// ---------------------------------------------------------------------------
// AlertDialog — Anular
// ---------------------------------------------------------------------------

function DialogAnular({
  item,
  onCerrar,
  onAnulada,
}: {
  item: InspeccionResumen | null;
  onCerrar: () => void;
  onAnulada: () => void;
}) {
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const anular = useAnularInspeccionMutation(item?.id ?? 0, {
    onSuccess: () => {
      setErrorAnular(null);
      toast.success("Inspección anulada");
      onAnulada();
      onCerrar();
    },
    onError: (err) => setErrorAnular(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorAnular(null);
      onCerrar();
    }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular inspección</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea anular la inspección{" "}
            {item?.codigo ? `#${item.codigo}` : ""}
            {item?.vehiculoPlaca ? ` (${item.vehiculoPlaca})` : ""}? Tenga en cuenta que
            esta información ya no se podrá recuperar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorAnular ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo anular</AlertTitle>
            <AlertDescription>{errorAnular}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={anular.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => anular.mutate()}
            disabled={anular.isPending}
          >
            {anular.isPending ? "Anulando..." : "Anular"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function InspeccionesListado() {
  const router = useRouter();

  const [filtros, setFiltros] = useState<FiltrosInspecciones>({
    estadoRegistro: "ACTIVO",
    pagina: 1,
    limite: 20,
  });
  const [estadoLocal, setEstadoLocal] = useState<string>("TODOS");
  const [registroLocal, setRegistroLocal] = useState<string>("ACTIVO");

  const [itemAnulando, setItemAnulando] = useState<InspeccionResumen | null>(null);

  const consulta = useInspeccionesQuery(filtros);
  const filas = consulta.data?.datos ?? [];
  const paginacion = consulta.data?.paginacion;

  function aplicarEstado(valor: string) {
    setEstadoLocal(valor);
    setFiltros((actual) => ({
      ...actual,
      estado: valor === "TODOS" ? undefined : (valor as EstadoInspeccion),
      pagina: 1,
    }));
  }

  function aplicarRegistro(valor: string) {
    setRegistroLocal(valor);
    setFiltros((actual) => ({
      ...actual,
      estadoRegistro: valor === "TODOS" ? undefined : (valor as EstadoRegistroChecklist),
      pagina: 1,
    }));
  }

  function cambiarPagina(pagina: number) {
    setFiltros((actual) => ({ ...actual, pagina }));
  }

  function abrirDetalle(id: number) {
    router.push(`/flota/checklist/inspecciones/${id}`);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Inspecciones</CardTitle>
            <CardDescription>
              {paginacion?.total ?? 0}{" "}
              {(paginacion?.total ?? 0) === 1 ? "registro" : "registros"} encontrados ·
              se inician desde la unidad en Unidades de flota
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la información</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-44 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={estadoLocal} onValueChange={aplicarEstado}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Estado: todos</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="COMPLETA">Completa</SelectItem>
                <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-44 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Registro</span>
            <Select value={registroLocal} onValueChange={aplicarRegistro}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Registro: activos</SelectItem>
                <SelectItem value="ANULADO">Registro: anulados</SelectItem>
                <SelectItem value="TODOS">Registro: todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Código</TableHead>
                <TableHead className="w-[26%]">Unidad</TableHead>
                <TableHead className="w-[18%]">Estado</TableHead>
                <TableHead className="w-[22%]">Iniciada</TableHead>
                <TableHead className="w-[20%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    <ClipboardList className="mx-auto mb-2 size-6 opacity-50" />
                    No hay inspecciones para el filtro aplicado.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((fila) => {
                  const esAnulada = fila.estadoRegistro === "ANULADO";
                  return (
                    <TableRow key={fila.id} className={esAnulada ? "opacity-60" : undefined}>
                      <TableCell className="font-mono text-sm">
                        {fila.codigo ? `#${fila.codigo}` : "—"}
                      </TableCell>
                      <TableCell className="truncate text-sm font-medium">
                        {fila.vehiculoPlaca ?? fila.unidadId}
                      </TableCell>
                      <TableCell>
                        {esAnulada ? (
                          <Badge variant="secondary">Anulada</Badge>
                        ) : (
                          <BadgeEstado estado={fila.estado} />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatoFecha(fila.iniciadaEn ?? fila.fechaCreacion)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                onClick={() => abrirDetalle(fila.id)}
                                aria-label="Ver / continuar"
                              >
                                <Eye />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver / continuar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setItemAnulando(fila)}
                                disabled={esAnulada || fila.estado === "CONFIRMADA"}
                                aria-label="Anular"
                              >
                                <Ban />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Anular</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {paginacion && paginacion.total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1}-
              {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{" "}
              {paginacion.total} registros
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paginacion.tieneAnterior}
                onClick={() => cambiarPagina(paginacion.pagina - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-20 text-center">
                {paginacion.pagina} / {paginacion.totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paginacion.tieneSiguiente}
                onClick={() => cambiarPagina(paginacion.pagina + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      <DialogAnular
        item={itemAnulando}
        onCerrar={() => setItemAnulando(null)}
        onAnulada={() => void consulta.refetch()}
      />
    </Card>
  );
}
