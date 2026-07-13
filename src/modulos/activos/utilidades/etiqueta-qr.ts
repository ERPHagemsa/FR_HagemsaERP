// Arma el contenido que se codifica en el QR de una etiqueta a partir de su
// `token`. La URL apunta a la pagina publica de escaneo `/e/{token}`.
//
// El dominio NO viene del backend (el back solo es dueño del token): se toma de
// donde esta desplegado el propio front. Por defecto usa `window.location.origin`
// (cero configuracion: en prod sera https://erp.hagemsa.com, en local
// http://localhost:3000). Se puede fijar un dominio canonico con
// `NEXT_PUBLIC_APP_URL` para evitar que, si alguien imprime QRs parado en un
// entorno de staging, el codigo quede grabado con ese dominio equivocado.
//
// Nota: el dominio queda "quemado" dentro de la imagen del QR al imprimirla; por
// eso conviene imprimir siempre desde el dominio de produccion.
export function urlEtiquetaQr(token: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");
  return `${base}/e/${token}`;
}
