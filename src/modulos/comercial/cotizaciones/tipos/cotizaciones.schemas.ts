// Schemas zod para validacion client-side del modulo Comercial / Cotizaciones.
// Separado de cotizaciones.tipos.ts para no acoplar runtime (zod) con type-only imports.

import { z } from "zod";
import { issuesAErroresCampo } from "../../prospectos/tipos/prospecto.schemas";

// Re-exportar helper para uso en formularios de cotizaciones
export { issuesAErroresCampo };

// ---------------------------------------------------------------------------
// Schema de Solicitud de Cliente (SC)
// ---------------------------------------------------------------------------

export const schemaRegistrarSC = z.object({
  origenTipo: z.enum(["PROSPECTO", "CLIENTE"], {
    message: "Selecciona un tipo de origen valido",
  }),
  origenId: z
    .string()
    .uuid("El ID del origen debe ser un UUID valido")
    .min(1, "El ID del origen es requerido"),
  contactoOrigenId: z
    .string()
    .uuid("El ID del contacto debe ser un UUID valido")
    .min(1, "El ID del contacto es requerido"),
  canalEntrada: z.enum(["CORREO", "PRESENCIAL", "LLAMADA", "OTRO"], {
    message: "Selecciona un canal de entrada valido",
  }),
  descripcionServicio: z
    .string()
    .min(1, "La descripcion del servicio es requerida"),
  fechaRequerida: z.string().optional(),
  observaciones: z.string().optional(),
});

export type DatosRegistrarSC = z.infer<typeof schemaRegistrarSC>;
