// Arma el contenido que se codifica en el QR de una etiqueta a partir de su
// `id`. La URL apunta al servicio de inventario existente
// (`/activo/?idactivo={id}`), que ya tiene la data y con el que conviven los
// QR del sistema anterior.
//
// OJO: pese a que el parametro de la URL se llama `idactivo`, lo que se envia es
// el ID de la ETIQUETA (asi lo definio el servicio de inventario; el nombre del
// parametro es historico y no se puede cambiar sin tocar ese otro sistema).
//
// El dominio es fijo (es un servicio externo, NO el front del ERP): por defecto
// `https://inventario.hagemsa.org`, configurable con `NEXT_PUBLIC_INVENTARIO_URL`
// por si cambia el host. Nota: el dominio queda "quemado" dentro de la imagen
// del QR al imprimirla, asi que conviene imprimir siempre contra el dominio real
// de produccion.
const INVENTARIO_BASE_URL = "https://inventario.hagemsa.org";

export function urlEtiquetaQr(idEtiqueta: number): string {
  const base = (process.env.NEXT_PUBLIC_INVENTARIO_URL || INVENTARIO_BASE_URL).replace(
    /\/+$/,
    "",
  );
  return `${base}/activo/?idactivo=${idEtiqueta}`;
}
