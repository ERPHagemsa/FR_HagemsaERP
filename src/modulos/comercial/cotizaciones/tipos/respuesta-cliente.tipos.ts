// Tipos del formulario PUBLICO de respuesta del cliente a una cotizacion
// (/c/[token]). El cliente no tiene sesion: el token del enlace es la unica
// credencial. Espeja el contrato de BC-03 (feature respuesta-cliente).

// Estado del enlace de cara al formulario: si acepta respuesta o no, y por que.
export type EstadoEnlaceRespuesta = "VIGENTE" | "RESPONDIDA" | "EXPIRADA"

// Las tres decisiones posibles del cliente (excluye el estado inicial PENDIENTE).
export type DecisionCliente = "ACEPTADA" | "RECHAZADA" | "NEGOCIAR"

// Resumen que ve el cliente. No trae datos internos del ERP (ej. ejecutivo):
// el documento completo se sirve aparte, como PDF.
export type CotizacionPublica = {
  codigoCotizacion: string
  cliente: string
  numeroVersion: number
  expiraEn: string
  estadoEnlace: EstadoEnlaceRespuesta
  // La decision ya registrada si el enlace fue respondido; si no, null.
  respuesta: DecisionCliente | null
}

export type RegistrarRespuestaPayload = {
  decision: DecisionCliente
  nombreRespondedor: string
  // Obligatorio al rechazar o negociar (lo valida el dominio en BC-03).
  comentario?: string
}
