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
// Schema de contacto
//
// Campos base compartidos por el contacto inicial (registro de prospecto) y
// el alta de contacto a un prospecto existente. `esPrincipal` NO es un campo
// base: solo se envia al agregar un contacto, no al registrar el prospecto
// (en el registro el backend marca el contacto inicial como principal).
// ---------------------------------------------------------------------------

const camposContacto = {
  nombre: z.string().min(1, "El nombre del contacto es requerido"),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  // Contrato API-Prospectos: email es obligatorio; telefono es opcional.
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("El email no tiene un formato valido"),
  // Spec 5.7: observaciones opcionales — compartido por contacto inicial y alta de contacto.
  observaciones: z.string().optional(),
};

// Contacto inicial del registro de prospecto — sin esPrincipal.
export const schemaContactoInicial = z.object(camposContacto);

export type DatosContactoInicial = z.infer<typeof schemaContactoInicial>;

// Alta de contacto a un prospecto existente — incluye esPrincipal.
// observaciones ya viene de camposContacto.
export const schemaAgregarContacto = z.object({
  ...camposContacto,
  esPrincipal: z.boolean(),
});

export type DatosAgregarContacto = z.infer<typeof schemaAgregarContacto>;

// Editar contacto (§5.10): parcial. Email valida formato solo si se envia.
export const schemaEditarContacto = z.object({
  nombre: z.string().min(1, "El nombre no puede estar vacio").optional(),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("El email no tiene un formato valido").optional(),
  observaciones: z.string().optional(),
});

export type DatosEditarContacto = z.infer<typeof schemaEditarContacto>;

// ---------------------------------------------------------------------------
// Schema de registro de prospecto
// ---------------------------------------------------------------------------

export const schemaRegistrarProspecto = z
  .object({
    // Contrato API-Prospectos §5.1: razonSocial obligatorio, nombreComercial opcional.
    nombreComercial: z.string().optional(),
    razonSocial: z.string().min(1, "La razon social es requerida"),
    direccion: z.string().min(1, "La direccion es requerida"),
    tipoDocumento: z.enum(["RUC", "DNI", "CE"], {
      message: "Selecciona un tipo de documento valido",
    }),
    numeroDocumento: z.string().min(1, "El numero de documento es requerido"),
    medioContactoInicial: z.enum(
      ["CORREO", "LLAMADA", "PRESENCIAL", "OTRO"],
      { message: "Selecciona un medio de contacto valido" }
    ),
    contactoInicial: schemaContactoInicial,
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

export const schemaActualizarProspecto = z
  .object({
    nombreComercial: z
      .string()
      .min(1, "El nombre comercial no puede estar vacio")
      .optional(),
    razonSocial: z
      .string()
      .min(1, "La razon social no puede estar vacia")
      .optional(),
    direccion: z
      .string()
      .min(1, "La direccion no puede estar vacia")
      .optional(),
    tipoDocumento: z.enum(["RUC", "DNI", "CE"]).optional(),
    numeroDocumento: z.string().min(1, "El numero de documento no puede estar vacio").optional(),
    medioContactoInicial: z
      .enum(["CORREO", "LLAMADA", "PRESENCIAL", "OTRO"])
      .optional(),
    // Spec 5.4: reasignar el ejecutivo responsable
    idEjecutivoResponsable: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.tipoDocumento || !data.numeroDocumento) return;
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
