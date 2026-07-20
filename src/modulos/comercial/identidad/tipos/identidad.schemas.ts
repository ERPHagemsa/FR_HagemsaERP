// Schema zod para validacion client-side del concern de identidad.
// Separado de identidad.tipos.ts para no acoplar runtime (zod) con type-only imports.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema de resolver identidad (tipoDocumento + numeroDocumento)
// ---------------------------------------------------------------------------

export const schemaResolverIdentidad = z.object({
  tipoDocumento: z.enum(["RUC", "DNI", "CE"], {
    message: "Selecciona un tipo de documento valido",
  }),
  numeroDocumento: z
    .string()
    .min(1, "El numero de documento es requerido")
    .trim(),
});

export type DatosResolverIdentidad = z.infer<typeof schemaResolverIdentidad>;
