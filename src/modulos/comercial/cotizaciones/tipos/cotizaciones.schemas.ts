// Schemas zod para validacion client-side del modulo Comercial / Cotizaciones.
// Separado de cotizaciones.tipos.ts para no acoplar runtime (zod) con type-only imports.

import { z } from "zod";
import { issuesAErroresCampo } from "../../prospectos/tipos/prospecto.schemas";

// Re-exportar helper para uso en formularios de cotizaciones
export { issuesAErroresCampo };

// ---------------------------------------------------------------------------
// Schema de Solicitud de Cliente (SC) — union discriminada por origenTipo
// PROSPECTO: contactoOrigenId requerido
// CLIENTE: tipoDocumento + numeroDocumento requeridos, sin contactoOrigenId
// ---------------------------------------------------------------------------

const camposComunes = {
  origenId: z
    .string()
    .uuid("El ID del origen debe ser un UUID valido")
    .min(1, "El ID del origen es requerido"),
  canalEntrada: z.enum(["CORREO", "PRESENCIAL", "LLAMADA", "OTRO"] as const, {
    message: "Selecciona un canal de entrada valido",
  }),
  descripcionServicio: z
    .string()
    .min(1, "La descripcion del servicio es requerida"),
  fechaRequerida: z.string().optional(),
  observaciones: z.string().optional(),
};

export const schemaRegistrarSC = z.discriminatedUnion("origenTipo", [
  z.object({
    origenTipo: z.literal("PROSPECTO"),
    ...camposComunes,
    contactoOrigenId: z
      .string()
      .uuid("El ID del contacto debe ser un UUID valido")
      .min(1, "El ID del contacto es requerido"),
  }),
  z.object({
    origenTipo: z.literal("CLIENTE"),
    ...camposComunes,
    tipoDocumento: z.enum(["RUC", "DNI", "CE"] as const, {
      message: "Selecciona un tipo de documento valido",
    }),
    numeroDocumento: z
      .string()
      .min(1, "El numero de documento es requerido"),
  }),
]);

export type DatosRegistrarSC = z.infer<typeof schemaRegistrarSC>;

// ---------------------------------------------------------------------------
// Schemas de transiciones de estado (Slice 4)
// ---------------------------------------------------------------------------

// POST /cotizaciones/:id/enviar — validezDias es opcional (default 10 en backend);
// correos son los aprobadores que reciben la cotizacion por correo (1..20, HU-03-036).
export const schemaEnviar = z.object({
  validezDias: z
    .number({ message: "Ingresa un numero de dias valido" })
    .int("Debe ser un numero entero")
    .min(1, "La validez debe ser al menos 1 dia")
    .optional(),
  correos: z
    .array(z.string().trim().email("Correo invalido"))
    .min(1, "Agrega al menos un aprobador.")
    .max(20, "Maximo 20 correos."),
});

export type DatosEnviar = z.infer<typeof schemaEnviar>;

// POST /cotizaciones/:id/nueva-version — motivo requerido
export const schemaNuevaVersion = z.object({
  motivo: z
    .string()
    .min(1, "El motivo es requerido para crear una nueva version"),
});

export type DatosNuevaVersion = z.infer<typeof schemaNuevaVersion>;

// PATCH /cotizaciones/:id/perdida — motivoPerdida requerido
export const schemaPerdida = z.object({
  motivoPerdida: z
    .string()
    .min(1, "El motivo de perdida es requerido"),
});

export type DatosPerdida = z.infer<typeof schemaPerdida>;

// PATCH /cotizaciones/:id/ganada — fecha de inicio de servicio requerida,
// fin opcional; si hay fin, no puede ser anterior al inicio (comparacion lexica
// de fechas ISO "YYYY-MM-DD", que respeta el orden cronologico).
export const schemaGanada = z
  .object({
    fechaInicioServicio: z
      .string()
      .min(1, "La fecha de inicio de servicio es requerida"),
    fechaFinServicio: z.string().optional(),
  })
  .refine(
    (d) =>
      !d.fechaFinServicio ||
      d.fechaFinServicio.trim() === "" ||
      d.fechaFinServicio >= d.fechaInicioServicio,
    {
      message: "La fecha de fin no puede ser anterior a la de inicio",
      path: ["fechaFinServicio"],
    },
  );

export type DatosGanada = z.infer<typeof schemaGanada>;
