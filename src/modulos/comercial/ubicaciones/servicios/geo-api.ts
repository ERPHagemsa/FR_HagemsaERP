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

/**
 * Autocomplete de distrito por nombre parcial (typeahead). Insensible a
 * acentos/mayúsculas en el backend; prioriza los que empiezan con el texto.
 * Pensado para llamarse con debounce mientras el usuario escribe.
 */
export async function buscarDistritos(
  q: string,
  limite = 8
): Promise<DistritoGeo[]> {
  const { data } = await clienteGeo.get<{ data: DistritoGeo[] }>(
    "/distritos/buscar",
    { params: { q, limite } }
  );
  return data.data;
}

export async function listarDepartamentosGeo(): Promise<OpcionDepartamentoGeo[]> {
  const { data } = await clienteGeo.get<{ data: OpcionDepartamentoGeo[] }>("/departamentos");
  return data.data;
}

export async function listarProvinciasGeo(
  departamento?: string
): Promise<OpcionProvinciaGeo[]> {
  const { data } = await clienteGeo.get<{ data: OpcionProvinciaGeo[] }>("/provincias", {
    params: departamento ? { departamento } : undefined,
  });
  return data.data;
}

export async function listarDistritosGeo(
  departamento?: string,
  provincia?: string
): Promise<OpcionDistritoGeo[]> {
  const { data } = await clienteGeo.get<{ data: OpcionDistritoGeo[] }>("/distritos", {
    params: {
      ...(departamento ? { departamento } : {}),
      ...(provincia ? { provincia } : {}),
    },
  });
  return data.data;
}
