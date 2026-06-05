// Tipos del concern transversal de comercial: resolver identidad por documento.
// Consumido por solicitudes-cliente (seleccion de origen) y prospectos (dedup en alta).
// Solo declaraciones de tipo — sin imports de runtime (zod va en identidad.schemas.ts).

// Veredicto del endpoint GET /solicitudes-cliente/resolver-identidad.
// Contrato autoritativo: API-Cotizaciones.md §5.12 (BC-03 docs/source DTO).
export type VeredictoIdentidad =
  | "CLIENTE"
  | "CLIENTE_INACTIVO"
  | "PROSPECTO_EXISTENTE"
  | "NUEVO";

// Respuesta del endpoint resolver-identidad. Los campos opcionales solo
// aparecen segun el veredicto (ver tabla en API-Cotizaciones.md §5.12).
export type RespuestaResolverIdentidad = {
  veredicto: VeredictoIdentidad;
  // Presente cuando veredicto = PROSPECTO_EXISTENTE
  prospecto?: {
    prospectoId: string;
    razonSocial: string | null;
  };
  // Presente cuando veredicto = CLIENTE | CLIENTE_INACTIVO
  cliente?: {
    clienteId: string;
    razonSocial: string | null;
    nombreComercial: string | null;
    estado: string;
  };
};
