import { z } from "zod";

// Al aprobar (HU-03-037) se envia la cotizacion al cliente y un aviso al comercial:
// correoCliente es obligatorio (destinatario del PDF) y correosComercial 1..20.
export const schemaAprobar = z.object({
  comentario: z.string().trim().optional(),
  correoCliente: z.string().trim().email("Correo del cliente invalido."),
  correosComercial: z
    .array(z.string().trim().email("Correo invalido"))
    .min(1, "Agrega al menos un correo del area comercial.")
    .max(20, "Maximo 20 correos."),
});

export const schemaRechazar = z.object({
  motivo: z.string().trim().min(1, "El motivo es obligatorio."),
});
