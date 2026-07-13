"use client";

import {
  addMonths,
  eachDayOfInterval,
  format,
  isBefore,
  max,
  min,
  subMonths,
} from "date-fns";
import { useMemo, useState } from "react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";

import { PaginaListado } from "../../componentes/pagina-listado";
import { CalendarioCabecera } from "../componentes/calendario-cabecera";
import { calcularRangoGrilla, claveDia, CalendarioMensual } from "../componentes/calendario-mensual";
import { useEventosCalendarioQuery } from "../servicios/calendario-queries";
import type { EventoCalendario } from "../tipos/calendario.tipos";

const FORMATO_FECHA_API = "yyyy-MM-dd";

/**
 * Agrupa los eventos por cada dia que abarcan (design D4): un evento sin
 * `fin` solo pinta en `inicio`; un evento con `fin` pinta en cada dia del
 * intervalo inicio..fin, recortado al rango visible de la grilla. El front no
 * recalcula fechas de negocio: solo agrupa lo que ya devuelve el feed.
 */
function agruparEventosPorDia(
  eventos: EventoCalendario[],
  inicioGrilla: Date,
  finGrilla: Date
): Map<string, EventoCalendario[]> {
  const mapa = new Map<string, EventoCalendario[]>();

  for (const evento of eventos) {
    const inicio = max([new Date(evento.inicio), inicioGrilla]);
    const fin = evento.fin ? min([new Date(evento.fin), finGrilla]) : inicio;

    if (isBefore(fin, inicio)) continue;

    for (const dia of eachDayOfInterval({ start: inicio, end: fin })) {
      const clave = claveDia(dia);
      const lista = mapa.get(clave) ?? [];
      lista.push(evento);
      mapa.set(clave, lista);
    }
  }

  return mapa;
}

export function CalendarioVista() {
  const [mesVisible, setMesVisible] = useState<Date>(() => new Date());

  const { inicio: inicioGrilla, fin: finGrilla } = calcularRangoGrilla(mesVisible);

  // El rango pedido al feed es la grilla visible completa (incluye dias de
  // relleno del mes anterior/siguiente), no solo el mes — design D2.
  const rango = useMemo(
    () => ({
      desde: format(inicioGrilla, FORMATO_FECHA_API),
      hasta: format(finGrilla, FORMATO_FECHA_API),
    }),
    [inicioGrilla, finGrilla]
  );

  const { data, isLoading, isError, error, refetch } = useEventosCalendarioQuery(rango);

  const eventosPorDia = useMemo(
    () => agruparEventosPorDia(data ?? [], inicioGrilla, finGrilla),
    [data, inicioGrilla, finGrilla]
  );

  return (
    <PaginaListado>
      <CalendarioCabecera
        mesVisible={mesVisible}
        alAnterior={() => setMesVisible((mes) => subMonths(mes, 1))}
        alSiguiente={() => setMesVisible((mes) => addMonths(mes, 1))}
        alHoy={() => setMesVisible(new Date())}
      />
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar el calendario</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>
              {extraerMensajeError(error, "No se pudo cargar el calendario de ganadas")}
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <CalendarioMensual mesVisible={mesVisible} eventosPorDia={eventosPorDia} />
      )}
    </PaginaListado>
  );
}
