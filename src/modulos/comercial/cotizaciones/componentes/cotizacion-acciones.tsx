"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Edit, Send, GitBranch, Trophy, XCircle, X } from "lucide-react";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import type { Cotizacion, EstadoCotizacion } from "../tipos/cotizaciones.tipos";
import { accionesPermitidas } from "../tipos/cotizaciones.tipos";
import {
  schemaEnviar,
  schemaNuevaVersion,
  schemaPerdida,
} from "../tipos/cotizaciones.schemas";
import {
  useEnviarCotizacionMutation,
  useNuevaVersionMutation,
  useMarcarGanadaMutation,
  useMarcarPerdidaMutation,
  useCancelarCotizacionMutation,
} from "../servicios/cotizaciones-queries";
import { normalizarErrorAccion } from "../servicios/cotizaciones-error-handler";

type Props = {
  cotizacion: Cotizacion;
};

export function CotizacionAcciones({ cotizacion }: Props) {
  const router = useRouter();
  const { id, estado, versionVigente, versiones } = cotizacion;
  const acciones = accionesPermitidas(estado);

  // editar/enviar exigen version vigente NO congelada (es la editable).
  // nuevaVersion exige lo contrario: solo se ramifica una version ya enviada
  // (congelada). En EN_REVISION la vigente es un borrador sin enviar -> no se
  // habilita (ya hay una version editable; se edita esa, no se crea otra).
  const versionActual = versiones.find((v) => v.numeroVersion === versionVigente);
  const puedeEditar = acciones.editar && versionActual !== undefined && !versionActual.congelada;
  const puedeNuevaVersion =
    acciones.nuevaVersion && versionActual !== undefined && versionActual.congelada;

  const motivoTerminal = obtenerMotivoTerminal(estado);

  // Callback compartido tras cualquier 204 exitoso: refresca la pagina
  // (RSC detalle-vista se re-ejecuta con datos frescos del backend).
  function alExito(mensaje: string) {
    toast.success(mensaje);
    router.refresh();
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {/* Editar borrador */}
        <AccionBoton
          label="Editar"
          icono={<Edit data-icon="inline-start" />}
          habilitado={puedeEditar}
          tooltip={
            !acciones.editar
              ? motivoTerminal ?? "No se puede editar en este estado"
              : !puedeEditar
                ? "La version vigente ya esta congelada"
                : undefined
          }
          href={puedeEditar ? `/comercial/cotizaciones/${id}/editar` : undefined}
          variant="outline"
        />

        {/* Enviar */}
        {acciones.enviar ? (
          <DialogEnviar
            idCotizacion={id}
            onExito={() => alExito("Cotizacion enviada correctamente")}
          />
        ) : (
          <AccionBotonDeshabilitado
            label="Enviar"
            icono={<Send data-icon="inline-start" />}
            tooltip={motivoTerminal ?? "No se puede enviar en este estado"}
            variant="default"
          />
        )}

        {/* Nueva version: solo desde una version ya enviada (congelada) */}
        {puedeNuevaVersion ? (
          <DialogNuevaVersion
            idCotizacion={id}
            onExito={() => alExito("Nueva version creada correctamente")}
          />
        ) : (
          <AccionBotonDeshabilitado
            label="Nueva version"
            icono={<GitBranch data-icon="inline-start" />}
            tooltip={
              motivoTerminal ??
              (versionActual !== undefined && !versionActual.congelada
                ? "La version vigente aun no se ha enviado. Enviala antes de crear una nueva version."
                : "No se puede crear una nueva version en este estado")
            }
            variant="outline"
          />
        )}

        {/* Marcar ganada */}
        {acciones.ganar ? (
          <DialogGanada
            idCotizacion={id}
            onExito={() => alExito("Cotizacion marcada como ganada")}
          />
        ) : (
          <AccionBotonDeshabilitado
            label="Marcar ganada"
            icono={<Trophy data-icon="inline-start" />}
            tooltip={motivoTerminal ?? "No se puede marcar como ganada en este estado"}
            variant="outline"
          />
        )}

        {/* Marcar perdida */}
        {acciones.perder ? (
          <DialogPerdida
            idCotizacion={id}
            onExito={() => alExito("Cotizacion marcada como perdida")}
          />
        ) : (
          <AccionBotonDeshabilitado
            label="Marcar perdida"
            icono={<XCircle data-icon="inline-start" />}
            tooltip={motivoTerminal ?? "No se puede marcar como perdida en este estado"}
            variant="destructive"
          />
        )}

        {/* Cancelar */}
        {acciones.cancelar ? (
          <DialogCancelar
            idCotizacion={id}
            onExito={() => alExito("Cotizacion cancelada")}
          />
        ) : (
          <AccionBotonDeshabilitado
            label="Cancelar"
            icono={<X data-icon="inline-start" />}
            tooltip={motivoTerminal ?? "Solo se puede cancelar desde BORRADOR"}
            variant="outline"
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Enviar cotizacion
// validezDias opcional (integer >= 1, default 10 en el backend si se omite)
// ---------------------------------------------------------------------------

type DialogEnviarProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogEnviar({ idCotizacion, onExito }: DialogEnviarProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [validezDiasRaw, setValidezDiasRaw] = React.useState("");
  const [errorValidez, setErrorValidez] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useEnviarCotizacionMutation(idCotizacion);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setValidezDiasRaw("");
      setErrorValidez(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorValidez(null);
    setErrorForm(null);

    const payload: { validezDias?: number } = {};

    if (validezDiasRaw.trim() !== "") {
      const num = Number(validezDiasRaw.trim());
      const resultado = schemaEnviar.safeParse({ validezDias: num });
      if (!resultado.success) {
        setErrorValidez(resultado.error.issues[0]?.message ?? "Valor invalido");
        return;
      }
      payload.validezDias = resultado.data.validezDias;
    }

    setIsPending(true);
    try {
      await mutation.mutateAsync(payload);
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(err, "No se pudo enviar la cotizacion");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="default">
          <Send data-icon="inline-start" />
          Enviar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar cotizacion</DialogTitle>
          <DialogDescription>
            La cotizacion quedara enviada y la version vigente quedara congelada.
            Opcionalmente indica los dias de validez (por defecto 10 dias).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="validez-dias">
              Dias de validez{" "}
              <span className="text-muted-foreground">(opcional, default 10)</span>
            </Label>
            <Input
              id="validez-dias"
              type="number"
              min={1}
              placeholder="10"
              value={validezDiasRaw}
              onChange={(e) => {
                setValidezDiasRaw(e.target.value);
                if (errorValidez) setErrorValidez(null);
              }}
              disabled={isPending}
              aria-invalid={Boolean(errorValidez)}
            />
            {errorValidez ? (
              <p className="text-xs text-destructive">{errorValidez}</p>
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
              {isPending ? "Enviando..." : "Confirmar envio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
// Sin body — solo confirmacion
// ---------------------------------------------------------------------------

type DialogGanadaProps = {
  idCotizacion: string;
  onExito: () => void;
};

function DialogGanada({ idCotizacion, onExito }: DialogGanadaProps) {
  const [abierto, setAbierto] = React.useState(false);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useMarcarGanadaMutation(idCotizacion);

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
      const { mensaje } = normalizarErrorAccion(err, "No se pudo marcar la cotizacion como ganada");
      setErrorForm(mensaje);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          <Trophy data-icon="inline-start" />
          Marcar ganada
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar cotizacion como ganada</AlertDialogTitle>
          <AlertDialogDescription>
            La cotizacion pasara a estado GANADA. Si el origen es un prospecto, quedara
            registrado como convertido. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorForm ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorForm}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="default"
            onClick={onConfirmar}
            disabled={isPending}
          >
            {isPending ? "Procesando..." : "Confirmar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <XCircle data-icon="inline-start" />
          Marcar perdida
        </Button>
      </DialogTrigger>
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

// ---------------------------------------------------------------------------
// Sub-componente: boton habilitado (con href o sin)
// ---------------------------------------------------------------------------

type AccionBotonProps = {
  label: string;
  icono: React.ReactNode;
  habilitado: boolean;
  tooltip?: string;
  href?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  onClick?: () => void;
};

function AccionBoton({
  label,
  icono,
  habilitado,
  tooltip,
  href,
  variant = "outline",
  onClick,
}: AccionBotonProps) {
  if (habilitado) {
    if (href) {
      return (
        <Button asChild variant={variant}>
          <Link href={href}>
            {icono}
            {label}
          </Link>
        </Button>
      );
    }
    return (
      <Button variant={variant} onClick={onClick}>
        {icono}
        {label}
      </Button>
    );
  }

  // Deshabilitado con tooltip explicativo
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant={variant} disabled>
            {icono}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: boton deshabilitado con tooltip
// ---------------------------------------------------------------------------

type AccionBotonDeshabilitadoProps = {
  label: string;
  icono: React.ReactNode;
  tooltip?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

function AccionBotonDeshabilitado({
  label,
  icono,
  tooltip,
  variant = "outline",
}: AccionBotonDeshabilitadoProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button variant={variant} disabled>
            {icono}
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Helper: texto explicativo para estados terminales
// ---------------------------------------------------------------------------

function obtenerMotivoTerminal(estado: EstadoCotizacion): string | null {
  switch (estado) {
    case "GANADA":
      return "La cotizacion fue marcada como ganada y no admite mas cambios";
    case "PERDIDA":
      return "La cotizacion fue marcada como perdida y no admite mas cambios";
    case "CANCELADA":
      return "La cotizacion fue cancelada y no admite mas cambios";
    case "VENCIDA":
      return "La cotizacion vencio y no admite mas cambios";
    default:
      return null;
  }
}
