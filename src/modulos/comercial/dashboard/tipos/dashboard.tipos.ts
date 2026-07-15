// Tipos del modulo Comercial / Dashboard (BC-03, Fase 1).
// Solo declaraciones de tipo — sin imports de runtime. Son props de
// PRESENTACION para los widgets del slice `dashboard`: cada widget consulta
// sus propios datos con los hooks de los modulos origen (Cotizaciones,
// Solicitudes) y solo recibe por props lo necesario para renderizar/filtrar.
//
// Guardrail (design D8): este archivo NO declara agregaciones de negocio —
// nunca identificadores `monto*` ni `winRate*`. El calculo de dinero/win rate
// queda fuera de alcance de Fase 1 (backend, Fase 2).

/**
 * Filtro global de ejecutivo (design D2): `undefined` representa "Todos". Se
 * eleva como estado en `DashboardVista` y baja por props a cada widget.
 */
export type IdEjecutivoFiltro = string | undefined;

/** Props del selector global de ejecutivo: valor controlado, sin estado propio. */
export type DashboardFiltroEjecutivoProps = {
  idEjecutivoResponsable: IdEjecutivoFiltro;
  alCambiar: (idEjecutivoResponsable: IdEjecutivoFiltro) => void;
};

/** Props de la franja de KPI (design D4): solo el filtro vigente — cada widget hace su propia consulta. */
export type DashboardKpisProps = {
  idEjecutivoResponsable: IdEjecutivoFiltro;
};

/** Item generico de una lista accionable: id + etiqueta + enlace de detalle. */
export type DashboardItemAccionable = {
  id: string;
  titulo: string;
  subtitulo?: string;
  enlace: string;
};

/**
 * Props del widget presentacional generico de lista accionable (design D5):
 * base compartida por las listas "por aprobar", "sin cotizar" y "por vencer".
 */
export type DashboardListaAccionableProps = {
  titulo: string;
  items: DashboardItemAccionable[];
  isLoading: boolean;
  isError: boolean;
  mensajeError?: string;
  enlaceVerTodas?: string;
};

/** Props comunes de las listas especificas (3.4-3.6): solo el filtro vigente. */
export type DashboardListaEspecificaProps = {
  idEjecutivoResponsable: IdEjecutivoFiltro;
};
