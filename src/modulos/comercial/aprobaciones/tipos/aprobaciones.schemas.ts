import { z } from "zod";

export const schemaAprobar = z.object({
  comentario: z.string().trim().optional(),
});

export const schemaRechazar = z.object({
  motivo: z.string().trim().min(1, "El motivo es obligatorio."),
});
