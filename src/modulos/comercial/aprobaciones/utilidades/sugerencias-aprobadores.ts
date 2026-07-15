import type { SugerenciaCorreo } from "@/compartido/componentes/entrada-correos";

import type { AprobadorCuenta } from "../tipos/aprobadores-cuentas.tipos";

/**
 * Adapta las cuentas de aprobadores al formato que entiende EntradaCorreos.
 * Lo usan los diálogos de aprobación (solicitar y resolver), de ahí que viva
 * suelto y no dentro de uno de ellos.
 *
 * La etiqueta cae al usuario y luego al correo: el objetivo es que el chip
 * muestre algo reconocible, y un nombre vacío no debe dejarlo en blanco.
 */
export function sugerenciasAprobadores(
  cuentas: AprobadorCuenta[] | null | undefined,
): SugerenciaCorreo[] {
  if (!cuentas) return [];
  return cuentas.map((cuenta) => ({
    email: cuenta.email,
    etiqueta: cuenta.nombreCompleto?.trim() || cuenta.nombreUsuario?.trim() || cuenta.email,
    detalle: cuenta.nombreUsuario?.trim()
      ? `@${cuenta.nombreUsuario.trim()}`
      : undefined,
  }));
}
