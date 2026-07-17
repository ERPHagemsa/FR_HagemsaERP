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
import { CampoFecha } from "@/compartido/componentes/campo-fecha";
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
import { Textarea } from "@/compartido/componentes/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";

import { DialogDetalles } from "./cotizacion-detalles-dialog";
import type { Cotizacion } from "../tipos/cotizaciones.tipos";
import { accionesPermitidas } from "../tipos/cotizaciones.tipos";
import {
  schemaEnviar,
  schemaNuevaVersion,
  schemaPerdida,
  schemaGanada,
} from "../tipos/cotizaciones.schemas";
import { SelectorAprobadores } from "../../aprobaciones/componentes/selector-aprobadores";
import { AvisoEnvioCorreo } from "@/compartido/componentes/aviso-envio-correo";
import { useAprobadoresCuentasQuery } from "../../aprobaciones/servicios/aprobaciones-queries";
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
import { useSolicitudClienteQuery } from "../../solicitudes-cliente/servicios/solicitudes-cliente-queries";
import { aISODate, desdeISODate } from "@/compartido/utilidades";
import { invalidarConsulta } from "@/compartido/api";
import {
  CLAVE_COTIZACIONES,
  CLAVE_COTIZACION_DETALLE,
  CLAVE_PROSPECTOS,
} from "@/modulos/comercial/claves-consulta";

type Props = {
  cotizacion: Cotizacion;
  // Acciones contextuales que la vista inyecta (p. ej. resolver una solicitud de
  // aprobación). Se renderizan tras las acciones de ciclo de vida y ANTES de las
  // utilidades de lectura (PDF/Detalles), que siempre cierran la fila.
  accionesExtra?: React.ReactNode;
};

export function CotizacionAcciones({ cotizacion, accionesExtra }: Props) {
  const { id, estado, versionVigente, versiones, solicitudClienteId } = cotizacion;
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
          solicitudClienteId={solicitudClienteId}
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

      {accionesExtra}

      {/* Utilidades de lectura al final: exportar e inspeccionar la cotización. */}
      <BotonImprimirPdf idCotizacion={id} version={versionVigente} />
      <DialogDetalles cotizacion={cotizacion} />
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

function BotonImprimirPdf({ idCotizacion, version }: BotonImprimirPdfProps) {
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
// Dialog: Solicitar aprobacion (HU-03-036)
// Los dias de validez ya se fijan en el borrador (junto a la moneda) y quedan
// persistidos en la version; el backend usa ese valor almacenado. Lo que se pide
// aqui son los aprobadores a quienes se les envia la cotizacion (con el PDF
// adjunto) al solicitar la aprobacion.
//
// Los destinatarios salen del servicio de autenticacion y NO se escriben a mano:
// quien puede aprobar una cotizacion lo define auth, no quien la envia. Vienen
// todos marcados y se pueden desmarcar.
// ---------------------------------------------------------------------------

type BotonSolicitarAprobacionProps = {
  idCotizacion: string;
  onExito: () => void;
};

function BotonSolicitarAprobacion({ idCotizacion, onExito }: BotonSolicitarAprobacionProps) {
  const [abierto, setAbierto] = React.useState(false);
  // `null` = el usuario todavía no tocó nada, así que valen todos. La selección
  // se DERIVA de la lista en vez de copiarse a estado con un efecto: la consulta
  // resuelve después de abrir, y sincronizar estado con estado deja un frame con
  // la lista cargada y nada marcado.
  const [seleccionManual, setSeleccionManual] = React.useState<string[] | null>(
    null,
  );
  const [errorCorreos, setErrorCorreos] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const mutation = useSolicitarAprobacionMutation(idCotizacion);
  // Solo se consulta con el diálogo abierto. Los destinatarios salen de acá y no
  // se pueden escribir a mano: sin la lista no se puede solicitar aprobación (el
  // SelectorAprobadores muestra el motivo).
  const aprobadores = useAprobadoresCuentasQuery(abierto);

  // Todos marcados por defecto: mandársela a todos los aprobadores es el caso
  // normal, y desmarcar es más rápido que marcar.
  const correos = React.useMemo(
    () => seleccionManual ?? (aprobadores.data ?? []).map((c) => c.email),
    [seleccionManual, aprobadores.data],
  );

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Vuelve a `null` para que al reabrir se marquen todos de nuevo, aunque la
      // lista venga cacheada.
      setSeleccionManual(null);
      setErrorCorreos(null);
      setErrorForm(null);
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorCorreos(null);
    setErrorForm(null);

    const resultado = schemaEnviar.safeParse({ correos });
    if (!resultado.success) {
      setErrorCorreos(resultado.error.issues[0]?.message ?? "Correos invalidos");
      return;
    }

    setIsPending(true);
    try {
      // Sin validezDias: el backend usa el valor guardado en la version.
      await mutation.mutateAsync({ correos: resultado.data.correos });
      setAbierto(false);
      onExito();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(
        err,
        "No se pudo solicitar la aprobación",
      );
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
          Solicitar aprobación
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar aprobación</DialogTitle>
          <DialogDescription>
            La cotización se enviará por correo, con el PDF adjunto, a los
            aprobadores que queden marcados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>
              Aprobadores <span className="text-destructive">*</span>
            </Label>
            <SelectorAprobadores
              cuentas={aprobadores.data}
              cargando={aprobadores.isLoading}
              error={aprobadores.isError}
              seleccionados={correos}
              onChange={(nuevos) => {
                setSeleccionManual(nuevos);
                if (errorCorreos) setErrorCorreos(null);
              }}
              disabled={isPending}
            />
            {errorCorreos ? (
              <p className="text-xs text-destructive">{errorCorreos}</p>
            ) : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorForm}
            </p>
          ) : null}

          <AvisoEnvioCorreo visible={isPending} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            {/* Sin destinatarios no hay nada que enviar y el backend lo
                rechazaría igual: se bloquea acá para no gastar un viaje ni
                mostrar un error después de apretar. */}
            <Button type="submit" disabled={isPending || correos.length === 0}>
              {isPending ? "Enviando correo..." : "Enviar a aprobación"}
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
// Formulario: fecha de inicio de servicio (requerida) + fin (opcional).
// Estas fechas alimentan el calendario de Cotizaciones Ganadas.
// ---------------------------------------------------------------------------

type DialogGanadaProps = {
  idCotizacion: string;
  // SC de origen de la cotizacion (o null). Se usa para precargar la fecha de
  // inicio con la fecha requerida de la solicitud (default editable).
  solicitudClienteId: string | null;
  onExito: () => void;
};

function DialogGanada({ idCotizacion, solicitudClienteId, onExito }: DialogGanadaProps) {
  const [abierto, setAbierto] = React.useState(false);
  // Pick explicito del usuario. Mientras `inicioTocado` sea false se muestra la
  // precarga derivada de la SC; una vez que el usuario elige (o limpia) manda su
  // valor.
  const [fechaInicioServicio, setFechaInicioServicio] = React.useState<Date | undefined>(undefined);
  const [inicioTocado, setInicioTocado] = React.useState(false);
  const [fechaFinServicio, setFechaFinServicio] = React.useState<Date | undefined>(undefined);
  const [errorFechas, setErrorFechas] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const mutation = useMarcarGanadaMutation(idCotizacion);

  // Solo se consulta la SC mientras el dialogo esta abierto y hay origen SC.
  const { data: solicitud } = useSolicitudClienteQuery(
    abierto && solicitudClienteId ? solicitudClienteId : ""
  );

  // Precarga como valor DERIVADO en render (sin efecto ni setState): la fecha
  // requerida de la SC siembra el campo de inicio. Es un default editable —
  // "fecha requerida" no es exactamente "inicio de servicio" — asi que al tocar
  // el campo manda la eleccion del usuario.
  const fechaInicioValor = inicioTocado
    ? fechaInicioServicio
    : desdeISODate(solicitud?.fechaRequerida);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFechaInicioServicio(undefined);
      setInicioTocado(false);
      setFechaFinServicio(undefined);
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
      // El schema valida strings ISO; se convierte desde Date en partes locales.
      // Sin fecha -> "" para que dispare el mensaje "requerida" del schema.
      fechaInicioServicio: fechaInicioValor ? aISODate(fechaInicioValor) : "",
      fechaFinServicio: fechaFinServicio ? aISODate(fechaFinServicio) : undefined,
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
          <CampoFecha
            label="Fecha de inicio de servicio"
            requerido
            value={fechaInicioValor}
            onSelect={(fecha) => {
              setFechaInicioServicio(fecha);
              setInicioTocado(true);
              if (errorFechas) setErrorFechas(null);
            }}
            disabled={isPending}
          />

          <CampoFecha
            label="Fecha de fin de servicio (opcional)"
            value={fechaFinServicio}
            min={fechaInicioValor}
            onSelect={(fecha) => {
              setFechaFinServicio(fecha);
              if (errorFechas) setErrorFechas(null);
            }}
            disabled={isPending}
            error={errorFechas ?? undefined}
          />

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
