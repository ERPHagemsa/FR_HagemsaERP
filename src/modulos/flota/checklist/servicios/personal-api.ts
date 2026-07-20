import { clienteFlota } from "@/compartido/api/clientes-backend";
import type { Persona } from "../tipos/personal.tipos";

// Listado completo (sin paginar) del personal de BC01_SocioDeNegocio para los
// combobox de operadores: se carga una sola vez al abrir el sheet y se filtra
// en cliente (mismo patrón que los combobox de contrato/cuenta) — el API real
// no soporta filtrar por tipoRegimen server-side.
export async function obtenerTodoPersonal(): Promise<Persona[]> {
  const { data } = await clienteFlota.get<Persona[]>("/flota/personal/todos");
  return data;
}
