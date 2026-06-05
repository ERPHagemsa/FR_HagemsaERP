// Schemas zod para validacion client-side del modulo Comercial / Solicitudes de Cliente.
// Separado de solicitud-cliente.tipos.ts para no acoplar runtime (zod) con type-only imports.

import { z } from "zod";
import { issuesAErroresCampo } from "../../prospectos/tipos/prospecto.schemas";

// Re-exportar helper para uso en formularios del modulo SC
export { issuesAErroresCampo };

// ---------------------------------------------------------------------------
// Schema de descarte de SC
// ---------------------------------------------------------------------------

export const schemaDescartarSC = z.object({
  motivo: z
    .string()
    .min(1, "El motivo de descarte es requerido")
    .trim(),
});

export type DatosDescartarSC = z.infer<typeof schemaDescartarSC>;
