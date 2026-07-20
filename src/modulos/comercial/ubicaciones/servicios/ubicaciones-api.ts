import { clienteComercial } from "@/compartido/api/clientes-backend";

import type {
  PayloadCompletarUbicacion,
  Ubicacion,
  UbicacionTemporal,
  EstadoUbicacionTemporal,
} from "../tipos/ubicaciones.tipos";

// El backend envuelve los listados en { data: [...] }.
interface RespuestaLista<T> {
  data: T[];
}

// El contrato de completar/corregir del backend es POR NOMBRES. Los códigos
// geográficos (codigoDepartamento/Provincia/Distrito, ubigeo) que trae la
// geo-peru-api son solo para el selector/mapa del frontend y NO forman parte del
// contrato: el ValidationPipe del backend (forbidNonWhitelisted) rechaza campos
// no declarados. Se envía solo el whitelist que el DTO acepta.
function soloContratoBackend(p: PayloadCompletarUbicacion) {
  return {
    tipoUbicacion: p.tipoUbicacion,
    pais: p.pais,
    departamento: p.departamento,
    provincia: p.provincia,
    distrito: p.distrito,
    direccion: p.direccion,
    referenciaUbicacion: p.referenciaUbicacion,
    latitud: p.latitud,
    longitud: p.longitud,
    coordenadasGoogle: p.coordenadasGoogle,
  };
}

// GET /ubicaciones/temporales?idCotizacion=&estado=
// Ubicaciones temporales de una cotización (la bandeja "por completar" usa PENDIENTE).
export async function listarUbicacionesTemporales(
  idCotizacion: string,
  estado?: EstadoUbicacionTemporal
): Promise<UbicacionTemporal[]> {
  const { data } = await clienteComercial.get<RespuestaLista<UbicacionTemporal>>(
    "/ubicaciones/temporales",
    { params: { idCotizacion, estado } }
  );
  return data.data;
}

// PATCH /ubicaciones/temporales/:id/completar — completa datos (solo cotización
// GANADA). La dedup contra BC-14 la resuelve la fase final (PUB/SUB), no acá.
// Devuelve la temporal actualizada.
export async function completarUbicacionTemporal(
  id: string,
  payload: PayloadCompletarUbicacion
): Promise<UbicacionTemporal> {
  const { data } = await clienteComercial.patch<UbicacionTemporal>(
    `/ubicaciones/temporales/${id}/completar`,
    soloContratoBackend(payload)
  );
  return data;
}

// PATCH /ubicaciones/temporales/:id/corregir — corrige una ubicación YA
// SINCRONIZADA (el usuario detectó un error). Re-viaja a BC-14 como actualización;
// hasta 3 correcciones (la creación no cuenta). Mismo payload que completar.
export async function corregirUbicacionTemporal(
  id: string,
  payload: PayloadCompletarUbicacion
): Promise<UbicacionTemporal> {
  const { data } = await clienteComercial.patch<UbicacionTemporal>(
    `/ubicaciones/temporales/${id}/corregir`,
    soloContratoBackend(payload)
  );
  return data;
}

// GET /ubicaciones?busqueda= — maestra local (réplica confirmada de BC-14).
export async function listarUbicaciones(
  busqueda?: string
): Promise<Ubicacion[]> {
  const { data } = await clienteComercial.get<RespuestaLista<Ubicacion>>(
    "/ubicaciones",
    { params: { busqueda } }
  );
  return data.data;
}
