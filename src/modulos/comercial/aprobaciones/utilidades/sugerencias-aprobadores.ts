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
  return cuentas.map((cuenta) => {
    const nombreCompleto = cuenta.nombreCompleto?.trim();
    const nombreUsuario = cuenta.nombreUsuario?.trim();
    return {
      email: cuenta.email,
      etiqueta: nombreCompleto || nombreUsuario || cuenta.email,
      // El usuario solo acompaña cuando la etiqueta es el nombre completo: si la
      // cuenta no tiene nombre, la etiqueta YA es el usuario y repetirlo al lado
      // se lee como "jperez @jperez".
      detalle: nombreCompleto && nombreUsuario ? `@${nombreUsuario}` : undefined,
    };
  });
}
