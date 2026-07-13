"use client";

import * as React from "react";
import Link from "next/link";
import { Send, GitBranch, Trophy, XCircle, X, Printer, ScrollText } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/compartido/componentes/ui/alert-dialog";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog";
import { Label } from "@/compartido/componentes/ui/label";
import { Input } from "@/compartido/componentes/ui/input";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import { accionesPermitidas } from "../tipos/cotizaciones.tipos";
import {
  schemaNuevaVersion,
  schemaPerdida,
  schemaGanada,
} from "../tipos/cotizaciones.schemas";
import {
  useSolicitarAprobacionMutation,
  useNuevaVersionMutation,
  useMarcarGanadaMutation,
  useMarcarPerdidaMutation,
  useCancelarCotizacionMutation,
} from "../servicios/cotizaciones-queries";
import { useImprimirPdf } from "../ganchos/use-imprimir-pdf";
import { useTarifariosQuery } from "@/modulos/comercial/tarifarios/servicios/tarifarios-queries";
import { normalizarErrorAccion } from "../servicios/cotizaciones-error-handler";
import { invalidarConsulta } from "@/compartido/api";
import {
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_PROSPECTOS,
} from "@/modulos/comercial/claves-consulta";

type Props = {
  cotizacion: Cotizacion;
};

export function CotizacionAcciones({ cotizacion }: Props) {
  const { id, estado, versionVigente, versiones } = cotizacion;
  const acciones = accionesPermitidas(estado);

  // La edicion del contenido ya no es una accion aparte: se hace INLINE en el detalle
  // (la version vigente no congelada). Aqui solo queda nuevaVersion, que exige lo
  // contrario: solo se ramifica una version ya enviada (congelada).
  const versionActual = versiones.find((v) => v.numeroVersion === versionVigente);
  const puedeNuevaVersion =
    acciones.nuevaVersion && versionActual !== undefined && versionActual.congelada;

  // Callback compartido tras cualquier 204 exitoso: invalida las consultas
  // montadas para que se refetcheen con datos frescos del backend.
  function alExito(mensaje: string) {
    toast.success(mensaje);
    invalidarConsulta(CLAVE_COTIZACIONES);
    invalidarConsulta(CLAVE_COTIZACION_DETALLE);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {estado === "GANADA" ? <BotonTarifario idCotizacion={id} /> : null}

      {acciones.enviar ? (
        <BotonSolicitarAprobacion
          idCotizacion={id}
          onExito={() => alExito("Solicitud de aprobación enviada")}
        />
      ) : null}

      {puedeNuevaVersion ? (
        <DialogNuevaVersion
          idCotizacion={id}
          onExito={() => alExito("Nueva version creada correctamente")}
        />
      ) : null}

      {acciones.ganar ? (
        <DialogGanada
          idCotizacion={id}
          onExito={() => {
            alExito("Cotizacion marcada como ganada");
            invalidarConsulta(CLAVE_PROSPECTOS);
          }}
        />
      ) : null}

      {acciones.perder ? (
        <DialogPerdida
          idCotizacion={id}
          onExito={() => alExito("Cotizacion marcada como perdida")}
        />
      ) : null}

      {acciones.cancelar ? (
        <DialogCancelar
          idCotizacion={id}
          onExito={() => alExito("Cotizacion cancelada")}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Boton: Tarifario (solo cuando la cotizacion esta GANADA y ya tiene tarifario)
// El tarifario nace al ganar; lo ubicamos por su idCotizacionOrigen y enlazamos
// a su pagina de detalle. Si aun no existe (o falla), no se muestra el boton.
// ---------------------------------------------------------------------------

function BotonTarifario({ idCotizacion }: { idCotizacion: string }) {
  const { data } = useTarifariosQuery({
    idCotizacionOrigen: idCotizacion,
    porPagina: 1,
  });
  const tarifario = data?.data?.[0];

  if (!tarifario) return null;

  return (
    <Button asChild variant="outline">
      <Link href={`/comercial/tarifarios/${tarifario.id}`}>
        <ScrollText data-icon="inline-start" />
        Tarifario
      </Link>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Boton: Imprimir PDF (version vigente)
// La logica popup-safe de abrir el blob vive en useImprimirPdf (reutilizada
// tambien por el notebook para imprimir una version puntual).
// ---------------------------------------------------------------------------

type BotonImprimirPdfProps = {
  idCotizacion: string;
  version: number | null;
};

export function BotonImprimirPdf({ idCotizacion, version }: BotonImprimirPdfProps) {
  const { imprimir, generando } = useImprimirPdf(idCotizacion);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => imprimir(version ?? undefined)}
          disabled={generando}
          aria-label={generando ? "Generando PDF" : "Descargar PDF"}
        >
          <Printer />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{generando ? "Generando…" : "Descargar PDF"}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Boton: Solicitar aprobacion (envio directo)
// Los dias de validez ya se fijan en el borrador (junto a la moneda) y quedan
// persistidos en la version; aqui el backend usa ese valor almacenado (fallback
// a version.validezDias). Por eso el envio es directo: ya no hay formulario que
// bloquee la accion.
// ---------------------------------------------------------------------------

type BotonSolicitarAprobacionProps = {
  idCotizacion: string;
  onExito: () => void;
};

function BotonSolicitarAprobacion({ idCotizacion, onExito }: BotonSolicitarAprobacionProps) {
  const [isPending, setIsPending] = React.useState(false);
  const mutation = useSolicitarAprobacionMutation(idCotizacion);

  async function onSolicitar() {
    setIsPending(true);
    try {
      // Sin validezDias: el backend usa el valor guardado en la version.
      await mutation.mutateAsync({});
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(
        err,
        "No se pudo solicitar la aprobación",
      );
      toast.error(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      onClick={onSolicitar}
      disabled={isPending}
    >
      <Send data-icon="inline-start" />
      {isPending ? "Solicitando..." : "Solicitar aprobación"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Nueva version
// motivo requerido (no vacio)
// ---------------------------------------------------------------------------

type DialogNuevaVersionProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogNuevaVersion({ idCotizacion, onExito }: DialogNuevaVersionProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useNuevaVersionMutation(idCotizacion);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setMotivo("");
      setErrorMotivo(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorMotivo(null);
    setErrorForm(null);

    const resultado = schemaNuevaVersion.safeParse({ motivo });
    if (!resultado.success) {
      setErrorMotivo(resultado.error.issues[0]?.message ?? "El motivo es requerido");
      return;
    }

    setIsPending(true);
    try {
      await mutation.mutateAsync({ motivo: resultado.data.motivo });
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(err, "No se pudo crear la nueva version");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <GitBranch data-icon="inline-start" />
          Nueva version
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva version</DialogTitle>
          <DialogDescription>
            Se creara una nueva version editable. Indica el motivo de la revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo-version">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo-version"
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (errorMotivo) setErrorMotivo(null);
              }}
              disabled={isPending}
              placeholder="Describe el motivo de la nueva version..."
              className="min-h-20"
              aria-invalid={Boolean(errorMotivo)}
            />
            {errorMotivo ? (
              <p className="text-xs text-destructive">{errorMotivo}</p>
            ) : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorForm}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear nueva version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Marcar ganada
// Formulario: fecha de inicio de servicio (requerida) + fin (opcional).
// Estas fechas alimentan el calendario de Cotizaciones Ganadas.
// ---------------------------------------------------------------------------

type DialogGanadaProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogGanada({ idCotizacion, onExito }: DialogGanadaProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [fechaInicioServicio, setFechaInicioServicio] = React.useState("");
  const [fechaFinServicio, setFechaFinServicio] = React.useState("");
  const [errorFechas, setErrorFechas] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useMarcarGanadaMutation(idCotizacion);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFechaInicioServicio("");
      setFechaFinServicio("");
      setErrorFechas(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorFechas(null);
    setErrorForm(null);

    const resultado = schemaGanada.safeParse({
      fechaInicioServicio,
      fechaFinServicio: fechaFinServicio.trim() === "" ? undefined : fechaFinServicio,
    });
    if (!resultado.success) {
      setErrorFechas(resultado.error.issues[0]?.message ?? "Fechas invalidas");
      return;
    }

    setIsPending(true);
    try {
      await mutation.mutateAsync({
        fechaInicioServicio: resultado.data.fechaInicioServicio,
        ...(resultado.data.fechaFinServicio
          ? { fechaFinServicio: resultado.data.fechaFinServicio }
          : {}),
      });
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(err, "No se pudo marcar la cotizacion como ganada");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <Trophy data-icon="inline-start" />
              Ganada
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Marcar cotización como ganada</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar cotizacion como ganada</DialogTitle>
          <DialogDescription>
            La cotizacion pasara a estado GANADA. Si el origen es un prospecto, quedara
            registrado como convertido. Indica la fecha de inicio del servicio (y la
            de fin, si aplica). Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha-inicio-servicio">
              Fecha de inicio de servicio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fecha-inicio-servicio"
              type="date"
              value={fechaInicioServicio}
              onChange={(e) => {
                setFechaInicioServicio(e.target.value);
                if (errorFechas) setErrorFechas(null);
              }}
              disabled={isPending}
              aria-invalid={Boolean(errorFechas)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha-fin-servicio">
              Fecha de fin de servicio{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="fecha-fin-servicio"
              type="date"
              min={fechaInicioServicio || undefined}
              value={fechaFinServicio}
              onChange={(e) => {
                setFechaFinServicio(e.target.value);
                if (errorFechas) setErrorFechas(null);
              }}
              disabled={isPending}
              aria-invalid={Boolean(errorFechas)}
            />
            {errorFechas ? (
              <p className="text-xs text-destructive">{errorFechas}</p>
            ) : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorForm}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Marcar perdida
// motivoPerdida requerido (no vacio)
// ---------------------------------------------------------------------------

type DialogPerdidaProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogPerdida({ idCotizacion, onExito }: DialogPerdidaProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [motivoPerdida, setMotivoPerdida] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useMarcarPerdidaMutation(idCotizacion);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setMotivoPerdida("");
      setErrorMotivo(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorMotivo(null);
    setErrorForm(null);

    const resultado = schemaPerdida.safeParse({ motivoPerdida });
    if (!resultado.success) {
      setErrorMotivo(resultado.error.issues[0]?.message ?? "El motivo de perdida es requerido");
      return;
    }

    setIsPending(true);
    try {
      await mutation.mutateAsync({ motivoPerdida: resultado.data.motivoPerdida });
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(err, "No se pudo marcar la cotizacion como perdida");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive">
              <XCircle data-icon="inline-start" />
              Perdida
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Marcar cotización como perdida</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar cotizacion como perdida</DialogTitle>
          <DialogDescription>
            La cotizacion pasara a estado PERDIDA. Indica el motivo para el registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo-perdida">
              Motivo de perdida <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo-perdida"
              rows={3}
              value={motivoPerdida}
              onChange={(e) => {
                setMotivoPerdida(e.target.value);
                if (errorMotivo) setErrorMotivo(null);
              }}
              disabled={isPending}
              placeholder="Describe el motivo por el que se perdio la cotizacion..."
              className="min-h-20"
              aria-invalid={Boolean(errorMotivo)}
            />
            {errorMotivo ? (
              <p className="text-xs text-destructive">{errorMotivo}</p>
            ) : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorForm}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Cancelar cotizacion
// Sin body — solo desde BORRADOR
// ---------------------------------------------------------------------------

type DialogCancelarProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogCancelar({ idCotizacion, onExito }: DialogCancelarProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useCancelarCotizacionMutation(idCotizacion);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    event.preventDefault();
    setErrorForm(null);
    setIsPending(true);
    try {
      await mutation.mutateAsync(undefined);
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(err, "No se pudo cancelar la cotizacion");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          <X data-icon="inline-start" />
          Cancelar cotizacion
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar cotizacion</AlertDialogTitle>
          <AlertDialogDescription>
            La cotizacion pasara a estado CANCELADA. Solo es posible desde BORRADOR.
            Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorForm ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorForm}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmar}
            disabled={isPending}
          >
            {isPending ? "Cancelando..." : "Confirmar cancelacion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
