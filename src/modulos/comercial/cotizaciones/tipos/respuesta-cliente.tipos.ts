// Tipos del formulario PUBLICO de respuesta del cliente a una cotizacion
// (/c/[token]). El cliente no tiene sesion: el token del enlace es la unica
// credencial. Espeja el contrato de BC-03 (feature respuesta-cliente).

// Estado del enlace de cara al formulario: si acepta respuesta o no, y por que.
export type EstadoEnlaceRespuesta = "VIGENTE" | "RESPONDIDA" | "EXPIRADA"

// Las tres decisiones posibles del cliente (excluye el estado inicial PENDIENTE).
export type DecisionCliente = "ACEPTADA" | "RECHAZADA" | "NEGOCIAR"

// Motivo del catalogo que el cliente elige al rechazar o negociar. `requiereDetalle`
// obliga a acompañar la eleccion con texto libre (ej. "Otro motivo").
export type MotivoDisponible = {
  id: string
  codigo: string
  etiqueta: string
  requiereDetalle: boolean
}

// Motivos agrupados segun la decision en la que aplican.
export type MotivosPorTipo = {
  rechazo: MotivoDisponible[]
  negociacion: MotivoDisponible[]
}

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
  // Motivos que ofrece el formulario segun rechace o negocie.
  motivos: MotivosPorTipo
}

export type RegistrarRespuestaPayload = {
  decision: DecisionCliente
  nombreRespondedor: string
  // Motivo del catalogo. Obligatorio al rechazar o negociar.
  idMotivo?: string
  // Detalle libre. Obligatorio solo si el motivo elegido lo pide.
  comentario?: string
}
