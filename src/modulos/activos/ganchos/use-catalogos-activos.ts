"use client";

import { useMemo } from "react";

import { useValoresCatalogoQuery } from "../servicios/maestros-queries";
import type { TipoCatalogoMaestro, ValorCatalogo } from "../tipos/maestros.tipos";

export type OpcionCatalogo = { id: number; nombre: string };
export type OpcionCarroceria = OpcionCatalogo & {
  claseVehiculoReferenciaId: number | null;
};

/**
 * Ids reales de TipoActivoReferencia (catalogo dinamico, datos semilla de la
 * migracion de BC02_Activos). Estables porque son datos de referencia, no de
 * negocio editable.
 */
export const TIPO_ACTIVO_VEHICULO_ID = 1;
export const TIPO_ACTIVO_EQUIPO_ID = 2;
export const TIPO_ACTIVO_HERRAMIENTA_ID = 3;
export const TIPO_ACTIVO_DISPOSITIVO_ID = 4;
export const TIPO_ACTIVO_OTRO_ID = 5;

export interface CatalogosActivos {
  tiposActivo: OpcionCatalogo[];
  clasesVehiculo: OpcionCatalogo[];
  carrocerias: OpcionCarroceria[];
  clasesEuro: OpcionCatalogo[];
  tiposTransmision: OpcionCatalogo[];
  estadosCalibracion: OpcionCatalogo[];
  tiposDocumento: OpcionCatalogo[];
  estaCargando: boolean;
  /** Devuelve el `nombre` del valor de catalogo con ese id, o "" si no esta cargado/no existe. */
  nombrePorId: (
    tipoCatalogo: TipoCatalogoMaestro,
    id: number | null | undefined
  ) => string;
  /**
   * Busca el id de un valor de catalogo por nombre, normalizando acentos,
   * mayusculas y espacios (mismo criterio que `normalizarNombreCatalogo` en el
   * backend) para poder resolver reglas de negocio o codigos historicos
   * ("VEHICULO", "EURO_5", "NO_CALIBRADA", etc.) contra los nombres reales del
   * catalogo ("Vehiculo", "Euro 5", "No calibrada").
   */
  idPorNombre: (
    tipoCatalogo: TipoCatalogoMaestro,
    nombreBuscado: string | null | undefined
  ) => number | null;
}

export function normalizarNombreCatalogo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function aOpciones(valores: ValorCatalogo[] | null): OpcionCatalogo[] {
  return (valores ?? []).map((valor) => ({ id: valor.id, nombre: valor.nombre }));
}

function aCarrocerias(valores: ValorCatalogo[] | null): OpcionCarroceria[] {
  return (valores ?? []).map((valor) => ({
    id: valor.id,
    nombre: valor.nombre,
    claseVehiculoReferenciaId: valor.claseVehiculoReferenciaId ?? null,
  }));
}

export function useCatalogosActivos(): CatalogosActivos {
  const tipoActivo = useValoresCatalogoQuery("TIPO_ACTIVO", true);
  const claseVehiculo = useValoresCatalogoQuery("CLASE_VEHICULO", true);
  const carroceria = useValoresCatalogoQuery("CARROCERIA", true);
  const claseEuro = useValoresCatalogoQuery("CLASE_EURO", true);
  const tipoTransmision = useValoresCatalogoQuery("TIPO_TRANSMISION", true);
  const estadoCalibracion = useValoresCatalogoQuery("ESTADO_CALIBRACION", true);
  const tipoDocumento = useValoresCatalogoQuery("TIPO_DOCUMENTO", true);

  const porTipo = useMemo<Record<TipoCatalogoMaestro, ValorCatalogo[]>>(
    () => ({
      TIPO_ACTIVO: tipoActivo.data ?? [],
      CLASE_VEHICULO: claseVehiculo.data ?? [],
      CARROCERIA: carroceria.data ?? [],
      CLASE_EURO: claseEuro.data ?? [],
      TIPO_TRANSMISION: tipoTransmision.data ?? [],
      ESTADO_CALIBRACION: estadoCalibracion.data ?? [],
      TIPO_DOCUMENTO: tipoDocumento.data ?? [],
    }),
    [
      tipoActivo.data,
      claseVehiculo.data,
      carroceria.data,
      claseEuro.data,
      tipoTransmision.data,
      estadoCalibracion.data,
      tipoDocumento.data,
    ]
  );

  return useMemo<CatalogosActivos>(() => {
    const nombrePorId: CatalogosActivos["nombrePorId"] = (tipoCatalogo, id) => {
      if (id === null || id === undefined) return "";
      const encontrado = porTipo[tipoCatalogo].find((valor) => valor.id === id);
      return encontrado?.nombre ?? "";
    };

    const idPorNombre: CatalogosActivos["idPorNombre"] = (
      tipoCatalogo,
      nombreBuscado
    ) => {
      if (!nombreBuscado) return null;
      const objetivo = normalizarNombreCatalogo(nombreBuscado);
      const encontrado = porTipo[tipoCatalogo].find(
        (valor) => normalizarNombreCatalogo(valor.nombre) === objetivo
      );
      return encontrado?.id ?? null;
    };

    return {
      tiposActivo: aOpciones(porTipo.TIPO_ACTIVO),
      clasesVehiculo: aOpciones(porTipo.CLASE_VEHICULO),
      carrocerias: aCarrocerias(porTipo.CARROCERIA),
      clasesEuro: aOpciones(porTipo.CLASE_EURO),
      tiposTransmision: aOpciones(porTipo.TIPO_TRANSMISION),
      estadosCalibracion: aOpciones(porTipo.ESTADO_CALIBRACION),
      tiposDocumento: aOpciones(porTipo.TIPO_DOCUMENTO),
      estaCargando:
        tipoActivo.isLoading ||
        claseVehiculo.isLoading ||
        carroceria.isLoading ||
        claseEuro.isLoading ||
        tipoTransmision.isLoading ||
        estadoCalibracion.isLoading ||
        tipoDocumento.isLoading,
      nombrePorId,
      idPorNombre,
    };
  }, [
    porTipo,
    tipoActivo.isLoading,
    claseVehiculo.isLoading,
    carroceria.isLoading,
    claseEuro.isLoading,
    tipoTransmision.isLoading,
    estadoCalibracion.isLoading,
    tipoDocumento.isLoading,
  ]);
}
