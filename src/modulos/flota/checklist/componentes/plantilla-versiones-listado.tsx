"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, FileEdit, Plus, Send } from "lucide-react";

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
import { obtenerVersionPlantilla } from "../servicios/checklist-api";
import {
  useAnularVersionMutation,
  useCrearVersionMutation,
  usePublicarVersionMutation,
  useVersionesPlantillaQuery,
} from "../servicios/plantillas-queries";
import type { CrearVersionPayload, PlantillaVersion } from "../tipos/checklist.tipos";

// ---------------------------------------------------------------------------
// AlertDialog — Publicar
// ---------------------------------------------------------------------------

function DialogPublicar({
  version,
  onCerrar,
  onPublicada,
}: {
  version: PlantillaVersion | null;
  onCerrar: () => void;
  onPublicada: () => void;
}) {
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);

  const publicar = usePublicarVersionMutation(version?.id ?? "", {
    onSuccess: () => {
      setErrorPublicar(null);
      onPublicada();
      onCerrar();
    },
    onError: (err) => setErrorPublicar(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorPublicar(null);
      onCerrar();
    }
  }

  return (
    <AlertDialog open={version !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publicar versión {version?.numeroVersion}</AlertDialogTitle>
          <AlertDialogDescription>
            Al publicar, esta versión queda inmutable: para volver a cambiar la estructura
            va a hacer falta crear una versión nueva a partir de esta. Las inspecciones que
            se generen de ahora en más van a usar esta estructura.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorPublicar ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo publicar</AlertTitle>
            <AlertDescription>{errorPublicar}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={publicar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => publicar.mutate()} disabled={publicar.isPending}>
            {publicar.isPending ? "Publicando..." : "Publicar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// AlertDialog — Anular
// ---------------------------------------------------------------------------

function DialogAnularVersion({
  version,
  plantillaId,
  onCerrar,
  onAnulada,
}: {
  version: PlantillaVersion | null;
  plantillaId: string;
  onCerrar: () => void;
  onAnulada: () => void;
}) {
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const anular = useAnularVersionMutation(version?.id ?? "", plantillaId, {
    onSuccess: () => {
      setErrorAnular(null);
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
    <AlertDialog open={version !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular versión {version?.numeroVersion}</AlertDialogTitle>
          <AlertDialogDescription>
            {version?.publicada
              ? "Esta versión está publicada. Anularla no afecta las inspecciones ya generadas, pero deja de poder usarse para inspecciones nuevas."
              : "Se descarta este borrador. Esta información ya no se podrá recuperar."}
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
// Badges
// ---------------------------------------------------------------------------

function BadgePublicada({ version }: { version: PlantillaVersion }) {
  if (version.estadoRegistro === "ANULADO") {
    return <Badge variant="secondary">Anulada</Badge>;
  }
  return version.publicada ? (
    <Badge variant="default">Publicada</Badge>
  ) : (
    <Badge variant="outline">Borrador</Badge>
  );
}

function fechaCorta(valor: string | null): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-PE");
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PlantillaVersionesListado({ plantillaId }: { plantillaId: string }) {
  const router = useRouter();
  const [pagina, setPagina] = useState(1);

  const consulta = useVersionesPlantillaQuery(plantillaId, { pagina, limite: 20 });
  const filas = consulta.data?.datos ?? [];
  const paginacion = consulta.data?.paginacion;

  const [versionPublicando, setVersionPublicando] = useState<PlantillaVersion | null>(null);
  const [versionAnulando, setVersionAnulando] = useState<PlantillaVersion | null>(null);

  const crearVersion = useCrearVersionMutation(plantillaId);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [creandoBorrador, setCreandoBorrador] = useState(false);

  const hayBorradorActivo = filas.some(
    (v) => !v.publicada && v.estadoRegistro === "ACTIVO",
  );

  function handleRefetch() {
    void consulta.refetch();
  }

  async function handleNuevaVersion() {
    setErrorCrear(null);
    setCreandoBorrador(true);
    try {
      const publicadaActual = filas.find((v) => v.publicada && v.estadoRegistro === "ACTIVO");
      let payload: CrearVersionPayload;

      if (publicadaActual) {
        // Clon exacto de la versión publicada vigente: el backend no tiene un
        // endpoint de "clonar", así que se arma el POST con lo que devuelve el
        // GET (sin los `id`, que el backend reasigna).
        const detalle = await obtenerVersionPlantilla(publicadaActual.id);
        payload = {
          criterioAplicabilidad: detalle.criterioAplicabilidad,
          setNeumaticosDefault: detalle.setNeumaticosDefault,
          presentacion: detalle.presentacion,
          secciones: detalle.secciones.map((s) => ({
            nombre: s.nombre,
            orden: s.orden,
            ambito: s.ambito,
            items: s.items.map((it) => ({
              etiqueta: it.etiqueta,
              etiquetaImpresa: it.etiquetaImpresa,
              tipoRespuesta: it.tipoRespuesta,
              requerido: it.requerido,
              capturaCantidad: it.capturaCantidad,
              unidad: it.unidad,
              rangoMin: it.rangoMin,
              rangoMax: it.rangoMax,
              opciones: it.opciones,
              orden: it.orden,
            })),
          })),
        };
      } else {
        payload = { secciones: [] };
      }

      const nueva = await crearVersion.mutateAsync(payload);
      router.push(`/flota/checklist/plantillas/${plantillaId}/versiones/${nueva.id}`);
    } catch (err) {
      setErrorCrear(extraerMensajeError(err));
    } finally {
      setCreandoBorrador(false);
    }
  }

  function cambiarPagina(nueva: number) {
    setPagina(nueva);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Versiones</CardTitle>
            <CardDescription>
              {paginacion?.total ?? 0}{" "}
              {(paginacion?.total ?? 0) === 1 ? "versión" : "versiones"}
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={handleNuevaVersion}
                  disabled={hayBorradorActivo || creandoBorrador}
                >
                  <Plus data-icon="inline-start" />
                  {creandoBorrador ? "Creando..." : "Nueva versión"}
                </Button>
              </span>
            </TooltipTrigger>
            {hayBorradorActivo ? (
              <TooltipContent>
                Ya hay un borrador sin publicar — termínelo o anúlelo antes de crear otro.
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la información</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        {errorCrear ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo crear la versión</AlertTitle>
            <AlertDescription>{errorCrear}</AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Versión</TableHead>
                <TableHead className="w-[25%]">Estado</TableHead>
                <TableHead className="w-[25%]">Publicada el</TableHead>
                <TableHead className="w-[35%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    Esta plantilla todavía no tiene versiones.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="text-sm font-medium">
                      v{version.numeroVersion}
                    </TableCell>
                    <TableCell>
                      <BadgePublicada version={version} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fechaCorta(version.publicadaEn)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              asChild
                              aria-label="Ver estructura"
                            >
                              <Link
                                href={`/flota/checklist/plantillas/${plantillaId}/versiones/${version.id}`}
                              >
                                <FileEdit />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {version.publicada ? "Ver estructura" : "Editar estructura"}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setVersionPublicando(version)}
                              disabled={version.publicada || version.estadoRegistro === "ANULADO"}
                              aria-label="Publicar"
                            >
                              <Send />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Publicar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setVersionAnulando(version)}
                              disabled={version.estadoRegistro === "ANULADO"}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {paginacion && paginacion.total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1}-
              {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{" "}
              {paginacion.total} versiones
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

      <DialogPublicar
        version={versionPublicando}
        onCerrar={() => setVersionPublicando(null)}
        onPublicada={handleRefetch}
      />
      <DialogAnularVersion
        version={versionAnulando}
        plantillaId={plantillaId}
        onCerrar={() => setVersionAnulando(null)}
        onAnulada={handleRefetch}
      />
    </Card>
  );
}
