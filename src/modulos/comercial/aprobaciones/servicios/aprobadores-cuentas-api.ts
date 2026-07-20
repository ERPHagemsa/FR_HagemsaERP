import { clienteHttp } from "@/compartido/api/cliente-http";

import type { AprobadorCuenta } from "../tipos/aprobadores-cuentas.tipos";

// GET /api/admin/cuentas/correos-aprobadores-cotizaciones-comercial
//
// Lo sirve el servicio de autenticacion (por eso la ruta va bajo /api/admin y no
// bajo /api/comercial); el Route Handler de Next inyecta el bearer de la sesion.
// Devuelve las cuentas ACTIVAS marcadas como aprobadoras de cotizaciones, ya
// filtradas por el backend. Sin aprobadores marcados -> lista vacia.
//
// Requiere el permiso `auth:account:read-emails`: si el usuario no lo tiene el
// endpoint responde 403. Quien lo consuma debe degradar a carga manual de
// correos, no romper el formulario.
export async function obtenerAprobadoresCotizaciones(): Promise<
  AprobadorCuenta[]
> {
  const { data } = await clienteHttp.get<{ datos: AprobadorCuenta[] }>(
    "/api/admin/cuentas/correos-aprobadores-cotizaciones-comercial"
  );
  return Array.isArray(data?.datos) ? data.datos : [];
}
