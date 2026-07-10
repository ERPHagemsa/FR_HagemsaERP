"use client";

import { useState } from "react";
import { QrCode, ScanLine } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { LectorQrEtiqueta } from "./lector-qr-etiqueta";
import { obtenerEtiquetas } from "../servicios/etiquetas-api";
import { useEtiquetasQuery } from "../servicios/etiquetas-queries";
import type { EstadoEtiqueta, Etiqueta } from "../tipos/etiquetas.tipos";

const BADGE_VARIANTE: Record<
  EstadoEtiqueta,
  "default" | "secondary" | "destructive" | "outline"
> = {
  GENERADA: "outline",
  ASIGNADA: "default",
  REEMPLAZADA: "secondary",
  ANULADA: "destructive",
};

const BADGE_TEXTO: Record<EstadoEtiqueta, string> = {
  GENERADA: "Generada",
  ASIGNADA: "Asignada",
  REEMPLAZADA: "Reemplazada",
  ANULADA: "Anulada",
};

/**
 * Seccion "Etiqueta QR" de Editar activo (solo edicion; en Ver la ficha es de
 * lectura). Muestra la etiqueta vinculada al activo y permite LEER una
 * etiqueta impresa (camara o foto) para vincularla. La accion final de
 * vincular queda deshabilitada hasta que el backend de asignacion exponga su
 * endpoint (slice `asignacion` en construccion) — el lector y la resolucion
 * del token ya funcionan de punta a punta.
 */
export function EtiquetaActivoSeccion({ activoId }: { activoId: number }) {
  const [lectorAbierto, setLectorAbierto] = useState(false);
  const [etiquetaLeida, setEtiquetaLeida] = useState<Etiqueta | null>(null);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  const vinculadas = useEtiquetasQuery({ activoId });
  const etiquetaActual =
    (vinculadas.data ?? []).find((item) => item.estado === "ASIGNADA") ?? null;

  async function handleTokenLeido(token: string) {
    setLectorAbierto(false);
    setErrorLectura(null);
    setEtiquetaLeida(null);
    setResolviendo(true);
    try {
      // Resolucion client-side por token mientras no exista el endpoint
      // resolver del slice de asignacion.
      const todas = await obtenerEtiquetas();
      const encontrada = todas.find((item) => item.token === token) ?? null;
      if (!encontrada) {
        setErrorLectura(
          "El QR se leyo bien pero no corresponde a ninguna etiqueta del maestro."
        );
        return;
      }
      setEtiquetaLeida(encontrada);
    } catch (err) {
      setErrorLectura(extraerMensajeError(err));
    } finally {
      setResolviendo(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <QrCode className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Etiqueta QR</h3>
            {vinculadas.isLoading ? (
              <Skeleton className="mt-1 h-4 w-40" />
            ) : etiquetaActual ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono font-medium text-foreground">
                  {etiquetaActual.codigo}
                </span>
                <Badge variant={BADGE_VARIANTE[etiquetaActual.estado]}>
                  {BADGE_TEXTO[etiquetaActual.estado]}
                </Badge>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin etiqueta vinculada.
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEtiquetaLeida(null);
            setErrorLectura(null);
            setLectorAbierto(true);
          }}
        >
          <ScanLine />
          {etiquetaActual ? "Reemplazar etiqueta" : "Vincular etiqueta QR"}
        </Button>
      </div>

      {resolviendo ? <Skeleton className="h-16 w-full" /> : null}

      {errorLectura ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo resolver la etiqueta</AlertTitle>
          <AlertDescription>{errorLectura}</AlertDescription>
        </Alert>
      ) : null}

      {etiquetaLeida ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Etiqueta leida:</span>
            <span className="font-mono text-sm font-semibold">
              {etiquetaLeida.codigo}
            </span>
            <Badge variant={BADGE_VARIANTE[etiquetaLeida.estado]}>
              {BADGE_TEXTO[etiquetaLeida.estado]}
            </Badge>
          </div>
          {etiquetaLeida.activo && etiquetaLeida.activoId !== activoId ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Ojo: esta etiqueta ya esta asignada a {etiquetaLeida.activo.codigo}{" "}
              ({etiquetaLeida.activo.descripcion || "sin descripcion"}).
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <Button type="button" disabled title="Disponible cuando el proceso de asignacion este listo">
              Vincular a este activo
            </Button>
            <p className="text-xs text-muted-foreground">
              La vinculacion se habilita cuando el proceso de asignacion del
              backend este disponible (en construccion).
            </p>
          </div>
        </div>
      ) : null}

      <LectorQrEtiqueta
        abierto={lectorAbierto}
        onCerrar={() => setLectorAbierto(false)}
        onTokenLeido={(token) => void handleTokenLeido(token)}
      />
    </section>
  );
}
