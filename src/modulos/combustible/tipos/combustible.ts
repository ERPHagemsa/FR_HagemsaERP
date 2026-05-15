export type HealthResponse = {
  service: "bc09-control-combustible-api";
  status: "ok";
  timestamp: string;
};

export type EstadoManifiesto =
  | "PROGRAMADO"
  | "EN_RUTA"
  | "CERRADO"
  | "ANULADO";

export type ManifiestoResponse = {
  id: string;
  estado: EstadoManifiesto;
  ruta: string;
};

export type CrearSolicitudDesdeManifiestoRequest = {
  manifiestoId: string;
  placa: string;
  litrosSolicitados: number;
};

export type SolicitudResponse = {
  id: string;
  manifiestoId: string;
  vehiculoId: string;
  placa: string;
  contratoId: string;
  estadoFlota: string;
  ruta: string;
  litrosSolicitados: number;
  createdAt: string;
};

export type CrearAbastecimientoRequest = {
  solicitudId: string;
  litrosDespachados: number;
  nroTicket: string;
};

export type AbastecimientoResponse = {
  id: string;
  solicitudId: string;
  vehiculoId: string;
  placa: string;
  litrosDespachados: number;
  nroTicket: string;
  createdAt: string;
};
