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
