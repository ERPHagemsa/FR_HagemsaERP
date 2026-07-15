"use client";

import * as React from "react";

import { esError409 } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { EntradaCorreos } from "@/compartido/componentes/entrada-correos";
import { normalizarErrorAccion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-error-handler";
import { useConsultarCotizacion } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-queries";

import {
  invalidarAprobaciones,
  useAprobadoresCuentasQuery,
  useAprobarMutation,
  useRechazarMutation,
} from "../servicios/aprobaciones-queries";
import { schemaAprobar, schemaRechazar } from "../tipos/aprobaciones.schemas";
import { sugerenciasAprobadores } from "../utilidades/sugerencias-aprobadores";

/** El porton es binario: dejar salir la cotizacion, o no dejarla salir. */
export type AccionResolver = "aprobar" | "rechazar";

/**
 * Dialogo controlado: no trae trigger propio. Quien lo usa decide desde donde
 * se dispara (menu `⋯` de la tabla, botones del detalle) y es dueño del estado
 * de apertura. Montarlo bajo demanda —solo cuando hay una accion elegida— hace
 * que el estado del formulario nazca limpio en cada apertura.
 */
type Props = {
  idSolicitud: string;
  /** Cotización de la solicitud; se usa para precargar el correo del cliente al aprobar. */
  idCotizacion: string;
  accion: AccionResolver;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
};

const CONFIG: Record<AccionResolver, {
  titulo: string;
  descripcion: string;
  label: string;
  placeholder: string;
  boton: string;
  procesando: string;
  obligatorio: boolean;
  destructivo?: boolean;
}> = {
  aprobar: {
    titulo: "Aprobar solicitud",
    descripcion: "La cotización pasará a enviada si la solicitud se aprueba.",
    label: "Comentario",
    placeholder: "Comentario opcional para el historial...",
    boton: "Aprobar",
    procesando: "Aprobando...",
    obligatorio: false,
  },
  rechazar: {
    titulo: "Rechazar solicitud",
    descripcion:
      "La cotización volverá a borrador para que el ejecutivo la corrija y la reenvíe.",
    label: "Motivo",
    // El motivo carga toda la semantica: tanto "no procede" como "ajustá la
    // linea 3". Por eso el placeholder invita a ser especifico.
    placeholder: "Indica qué hay que corregir o por qué se rechaza...",
    boton: "Rechazar",
    procesando: "Rechazando...",
    obligatorio: true,
    destructivo: true,
  },
};

export function DialogoResolverSolicitud({
  idSolicitud,
  idCotizacion,
  accion,
  abierto,
  onAbiertoChange,
}: Props) {
  const config = CONFIG[accion];
  const aprobar = useAprobarMutation(idSolicitud);
  const rechazar = useRechazarMutation(idSolicitud);

  // Solo al aprobar se consulta el detalle para precargar el correo del cliente;
  // con id vacío la query queda deshabilitada (enabled: Boolean(id)).
  const { data: cotizacion } = useConsultarCotizacion(
    accion === "aprobar" ? idCotizacion : "",
  );
  const correoClienteSugerido = cotizacion?.correoClienteSugerido ?? "";

  const [texto, setTexto] = React.useState("");
  // El correo mostrado es lo que editó el usuario o, si no tocó nada (null), el
  // sugerido. Así se precarga sin pisar una edición manual y sin efectos.
  const [correoEditado, setCorreoEditado] = React.useState<string | null>(null);
  const correoCliente = correoEditado ?? correoClienteSugerido;
  const [correosComercial, setCorreosComercial] = React.useState<string[]>([]);
  const [errorCampo, setErrorCampo] = React.useState<string | null>(null);
  const [errorCorreoCliente, setErrorCorreoCliente] = React.useState<string | null>(null);
  const [errorCorreosComercial, setErrorCorreosComercial] = React.useState<string | null>(null);
  const [errorForm, setErrorForm] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  // Solo se consulta con el diálogo abierto. Si falla (ej. sin el permiso para
  // leer correos), queda en null y el campo sigue funcionando a mano.
  const aprobadores = useAprobadoresCuentasQuery(abierto);

  async function onConfirmar(event: React.FormEvent) {
    event.preventDefault();
    setErrorCampo(null);
    setErrorCorreoCliente(null);
    setErrorCorreosComercial(null);
    setErrorForm(null);

    setIsPending(true);
    try {
      const valor = texto.trim();
      if (accion === "aprobar") {
        const resultado = schemaAprobar.safeParse({
          comentario: valor || undefined,
          correoCliente: correoCliente.trim(),
          correosComercial,
        });
        if (!resultado.success) {
          // Encamina cada error a su campo (correoCliente / correosComercial /
          // comentario) para mostrarlo junto al control correspondiente.
          for (const issue of resultado.error.issues) {
            const campo = issue.path[0];
            if (campo === "correoCliente") setErrorCorreoCliente(issue.message);
            else if (campo === "correosComercial") setErrorCorreosComercial(issue.message);
            else setErrorCampo(issue.message);
          }
          return;
        }
        await aprobar.mutateAsync(resultado.data);
      } else {
        const resultado = schemaRechazar.safeParse({ motivo: valor });
        if (!resultado.success) {
          setErrorCampo(resultado.error.issues[0]?.message ?? "El motivo es obligatorio.");
          return;
        }
        await rechazar.mutateAsync(resultado.data);
      }
      onAbiertoChange(false);
    } catch (err) {
      if (esError409(err)) {
        setErrorForm("La solicitud ya fue resuelta por otra operación.");
        invalidarAprobaciones();
      } else {
        const { mensaje } = normalizarErrorAccion(err, "No se pudo resolver la solicitud");
        setErrorForm(mensaje);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.titulo}</DialogTitle>
          <DialogDescription>{config.descripcion}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onConfirmar} className="flex flex-col gap-4">
          {accion === "aprobar" ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`correo-cliente-${idSolicitud}`}>
                  Correo del cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`correo-cliente-${idSolicitud}`}
                  type="email"
                  value={correoCliente}
                  onChange={(event) => {
                    setCorreoEditado(event.target.value);
                    if (errorCorreoCliente) setErrorCorreoCliente(null);
                  }}
                  placeholder="contacto@cliente.com"
                  disabled={isPending}
                  aria-invalid={Boolean(errorCorreoCliente)}
                />
                <p className="text-xs text-muted-foreground">
                  Recibe la cotización aprobada con el PDF adjunto.
                </p>
                {errorCorreoCliente ? (
                  <p className="text-xs text-destructive">{errorCorreoCliente}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`correos-comercial-${idSolicitud}`}>
                  Correos del área comercial <span className="text-destructive">*</span>
                </Label>
                <EntradaCorreos
                  id={`correos-comercial-${idSolicitud}`}
                  value={correosComercial}
                  onChange={(nuevos) => {
                    setCorreosComercial(nuevos);
                    if (errorCorreosComercial) setErrorCorreosComercial(null);
                  }}
                  disabled={isPending}
                  aria-invalid={Boolean(errorCorreosComercial)}
                  placeholder="comercial@hagemsa.com"
                  sugerencias={sugerenciasAprobadores(aprobadores.data)}
                  etiquetaSugerencias="Aprobadores"
                />
                {errorCorreosComercial ? (
                  <p className="text-xs text-destructive">{errorCorreosComercial}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`resolver-${accion}-${idSolicitud}`}>
              {config.label}{" "}
              {config.obligatorio ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opcional)</span>}
            </Label>
            <Textarea
              id={`resolver-${accion}-${idSolicitud}`}
              rows={3}
              value={texto}
              onChange={(event) => {
                setTexto(event.target.value);
                if (errorCampo) setErrorCampo(null);
              }}
              placeholder={config.placeholder}
              disabled={isPending}
              aria-invalid={Boolean(errorCampo)}
              className="min-h-20"
            />
            {errorCampo ? <p className="text-xs text-destructive">{errorCampo}</p> : null}
          </div>

          {errorForm ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorForm}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onAbiertoChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant={config.destructivo ? "destructive" : "default"} disabled={isPending}>
              {isPending ? config.procesando : config.boton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
