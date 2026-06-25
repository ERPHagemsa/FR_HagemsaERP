import { clienteSocioNegocios } from "@/compartido/api/clientes-backend"

import type { RespuestaDto } from "../tipos/socio-negocio"
import type {
  EventoConfiguracionGeneralRegistradoResponse,
  EventoConfiguracionGeneralRequest,
} from "../tipos/integracion-configuracion-general"

const BASE_ENDPOINT = "/integraciones/configuracion-general/eventos"

export async function registrarEventoConfiguracionGeneral(
  payload: EventoConfiguracionGeneralRequest,
): Promise<EventoConfiguracionGeneralRegistradoResponse> {
  const { data } = await clienteSocioNegocios.post<
    RespuestaDto<EventoConfiguracionGeneralRegistradoResponse>
  >(BASE_ENDPOINT, payload)
  return data.datos
}
