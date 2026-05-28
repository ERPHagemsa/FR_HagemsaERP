// Schemas zod para validacion client-side del modulo Comercial / Prospectos.
// Separado de prospecto.tipos.ts para no acoplar runtime (zod) con type-only imports.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Helper: convierte ZodError.issues a Record<campo, mensaje>
// ---------------------------------------------------------------------------

export function issuesAErroresCampo(
  error: z.ZodError
): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path[0]?.toString() ?? "_global";
    if (!errores[campo]) {
      errores[campo] = issue.message;
    }
  }
  return errores;
}

// ---------------------------------------------------------------------------
// Schema de documento segun tipo (RUC / DNI / CE)
// ---------------------------------------------------------------------------

// RUC: exactamente 11 digitos, empieza con 10 o 20
const REGEX_RUC = /^(10|20)\d{9}$/;
// DNI: exactamente 8 digitos
const REGEX_DNI = /^\d{8}$/;
// CE: alfanumerico, entre 9 y 12 caracteres
const REGEX_CE = /^[a-zA-Z0-9]{9,12}$/;

// ---------------------------------------------------------------------------
// Schema de contacto (reutilizado en registro y alta de contacto)
// ---------------------------------------------------------------------------

export const schemaAgregarContacto = z
  .object({
    nombre: z.string().min(1, "El nombre del contacto es requerido"),
    cargo: z.string().optional(),
    telefono: z.string().optional(),
    email: z
      .union([z.string().email("El email no tiene un formato valido"), z.literal("")])
      .optional(),
    esPrincipal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const tieneTelefono = data.telefono && data.telefono.trim().length > 0;
    const tieneEmail = data.email && data.email.trim().length > 0;
    if (!tieneTelefono && !tieneEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa al menos telefono o email",
        path: ["telefono"],
      });
    }
  });

export type DatosAgregarContacto = z.infer<typeof schemaAgregarContacto>;

// ---------------------------------------------------------------------------
// Schema de registro de prospecto
// ---------------------------------------------------------------------------

export const schemaRegistrarProspecto = z
  .object({
    nombreComercial: z
      .string()
      .min(1, "El nombre comercial es requerido"),
    razonSocial: z.string().optional(),
    tipoDocumento: z.enum(["RUC", "DNI", "CE"], {
      message: "Selecciona un tipo de documento valido",
    }),
    numeroDocumento: z.string().min(1, "El numero de documento es requerido"),
    medioContactoInicial: z.enum(
      ["CORREO", "LLAMADA", "PRESENCIAL", "OTRO"],
      { message: "Selecciona un medio de contacto valido" }
    ),
    contactoInicial: schemaAgregarContacto,
  })
  .superRefine((data, ctx) => {
    const { tipoDocumento, numeroDocumento } = data;

    if (tipoDocumento === "RUC" && !REGEX_RUC.test(numeroDocumento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "El RUC debe tener exactamente 11 digitos y comenzar con 10 o 20",
        path: ["numeroDocumento"],
      });
    }

    if (tipoDocumento === "DNI" && !REGEX_DNI.test(numeroDocumento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El DNI debe tener exactamente 8 digitos",
        path: ["numeroDocumento"],
      });
    }

    if (tipoDocumento === "CE" && !REGEX_CE.test(numeroDocumento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "El carnet de extranjeria debe tener entre 9 y 12 caracteres alfanumericos",
        path: ["numeroDocumento"],
      });
    }
  });

export type DatosRegistrarProspecto = z.infer<typeof schemaRegistrarProspecto>;

// ---------------------------------------------------------------------------
// Schema de actualizacion de prospecto (todos los campos opcionales)
// ---------------------------------------------------------------------------

export const schemaActualizarProspecto = z.object({
  nombreComercial: z.string().min(1, "El nombre comercial no puede estar vacio").optional(),
  razonSocial: z.string().optional(),
  medioContactoInicial: z
    .enum(["CORREO", "LLAMADA", "PRESENCIAL", "OTRO"])
    .optional(),
});

export type DatosActualizarProspecto = z.infer<typeof schemaActualizarProspecto>;

// ---------------------------------------------------------------------------
// Schema de descarte de prospecto
// ---------------------------------------------------------------------------

export const schemaDescartarProspecto = z.object({
  motivo: z
    .string()
    .min(1, "El motivo de descarte es requerido")
    .trim(),
});

export type DatosDescartarProspecto = z.infer<typeof schemaDescartarProspecto>;
