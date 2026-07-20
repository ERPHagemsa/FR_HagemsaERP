import { clienteComercial } from "@/compartido/api/clientes-backend";

// CRUD del catalogo de tipos de unidad de TERCERO (API-Integracion.md §5).
//
// Solo aplica a la fuente TERCERO: los tipos de ACTIVOS (flota propia) son de
// solo lectura desde Comercial y se administran en BC-02.
//
// El `codigo` NO se envia: el backend lo deriva del `nombre`
// (CodigoTipoUnidad.desdeNombre) y lo usa para detectar duplicados. Por eso el
// body solo lleva `nombre`.
//
// El listado del catalogo unido (ACTIVOS + terceros) para la tabla y el select
// vive en cotizaciones/servicios/tipos-unidad-api.ts (`listarTiposUnidad`), que
// esta vista reutiliza. Este archivo solo agrega las escrituras de tercero.

// POST /tipos-unidad/terceros — crea un tipo de unidad de tercero (201 -> { id }).
// Si existe un tercero inactivo con el mismo codigo derivado, el backend lo
// reactiva y devuelve su id original (reverso del soft-delete).
export async function crearTipoUnidadTercero(payload: {
  nombre: string;
}): Promise<{ id: string }> {
  const { data } = await clienteComercial.post<{ id: string }>(
    "/tipos-unidad/terceros",
    payload,
  );
  return data;
}

// PATCH /tipos-unidad/terceros/:id — renombra un tercero (204, sin cuerpo).
// Recalcula el codigo derivado. `:id` debe ser un UUID valido.
export async function actualizarTipoUnidadTercero(
  id: string,
  payload: { nombre: string },
): Promise<void> {
  await clienteComercial.patch(`/tipos-unidad/terceros/${id}`, payload);
}

// DELETE /tipos-unidad/terceros/:id — soft-delete (204, sin cuerpo).
// Marca estado_registro = false; la fila permanece para no romper cotizaciones
// historicas que ya congelaron su snapshot. Deja de aparecer en el catalogo.
export async function eliminarTipoUnidadTercero(id: string): Promise<void> {
  await clienteComercial.delete(`/tipos-unidad/terceros/${id}`);
}
