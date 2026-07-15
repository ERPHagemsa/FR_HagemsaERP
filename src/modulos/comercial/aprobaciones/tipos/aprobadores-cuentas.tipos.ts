// Aprobadores de cotizaciones segun el servicio de autenticacion (cuentas activas
// marcadas con el permiso correspondiente). No son datos de BC-03: se usan para
// poblar el selector de correos de los dialogos de aprobacion.
//
// El nombre viaja junto al correo para que el usuario identifique a quien esta
// eligiendo sin tener que descifrar la direccion.
export type AprobadorCuenta = {
  email: string
  nombreUsuario: string
  nombreCompleto: string
}
