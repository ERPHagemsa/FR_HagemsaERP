import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  ConsultarPersonalChecklistQuery,
  PersonalChecklistResponse,
} from "../tipos/personal-checklist"

const BASE_ENDPOINT = "/personal-checklist"

function crearQueryString(query?: ConsultarPersonalChecklistQuery): string {
  const params = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export async function consultarPersonalChecklist(
  query?: ConsultarPersonalChecklistQuery,
): Promise<PersonalChecklistResponse[]> {
  const { data } = await clienteSocioNegocios.get<
    RespuestaDto<PersonalChecklistResponse[]>
  >(`${BASE_ENDPOINT}${crearQueryString(query)}`)
  return data.datos
}
