import { ApiError } from "@/compartido/api";
import { clienteGeo } from "@/compartido/api/clientes-backend";

// Distrito resuelto por geo-peru-api (point-in-polygon sobre límites INEI).
export interface DistritoGeo {
  ubigeo: string;
  codigoDepartamento: string;
  departamento: string;
  codigoProvincia: string;
  provincia: string;
  codigoDistrito: string;
  distrito: string;
  capital: string | null;
}

/**
 * Reverse-geocoding exacto: distrito peruano que contiene el punto.
 * Devuelve `null` si el punto cae fuera del Perú (404) → el llamador puede
 * caer a otra fuente (ej. los niveles administrativos de Google).
 */
export async function resolverDistritoPorPunto(
  lat: number,
  lng: number
): Promise<DistritoGeo | null> {
  try {
    const { data } = await clienteGeo.get<DistritoGeo>(
      "/distritos/por-punto",
      { params: { lat, lng } }
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null; // el punto no cae en ningún distrito de Perú
    }
    throw error;
  }
}

// --- Cascada departamento → provincia → distrito (nombres en Título) ---
// Los endpoints envuelven la lista en `{ data: [...] }`.

export interface OpcionDepartamentoGeo {
  codigo: string;
  nombre: string;
}

export interface OpcionProvinciaGeo {
  codigo: string;
  nombre: string;
  codigoDepartamento: string;
  departamento: string;
}

export interface OpcionDistritoGeo {
  ubigeo: string;
  nombre: string;
  codigoProvincia: string;
  provincia: string;
  codigoDepartamento: string;
  departamento: string;
}

interface RespuestaLista<T> {
  data: T[];
}

/** Departamentos del Perú, ordenados por nombre. */
export async function listarDepartamentos(): Promise<OpcionDepartamentoGeo[]> {
  const { data } = await clienteGeo.get<RespuestaLista<OpcionDepartamentoGeo>>(
    "/departamentos"
  );
  return data.data;
}

/** Provincias del departamento (nombre o código). Sin filtro → todas. */
export async function listarProvincias(
  departamento?: string
): Promise<OpcionProvinciaGeo[]> {
  const { data } = await clienteGeo.get<RespuestaLista<OpcionProvinciaGeo>>(
    "/provincias",
    { params: departamento ? { departamento } : undefined }
  );
  return data.data;
}

/** Distritos filtrando por departamento y/o provincia (acumulativos). */
export async function listarDistritos(
  departamento?: string,
  provincia?: string
): Promise<OpcionDistritoGeo[]> {
  const params: Record<string, string> = {};
  if (departamento) params.departamento = departamento;
  if (provincia) params.provincia = provincia;
  const { data } = await clienteGeo.get<RespuestaLista<OpcionDistritoGeo>>(
    "/distritos",
    { params }
  );
  return data.data;
}
