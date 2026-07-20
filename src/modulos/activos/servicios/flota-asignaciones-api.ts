import { clienteFlota } from "@/compartido/api/clientes-backend";

type ReferenciaFlota = {
  id?: string | number | null;
  codigo?: string | null;
  nombre?: string | null;
};

type AsignacionContratoFlotaApi = {
  id?: string | number | null;
  unidadId?: string | number | null;
  activoId?: string | number | null;
  contrato?: ReferenciaFlota | null;
  cuenta?: ReferenciaFlota | null;
  estadoRegistro?: string | null;
};

type RespuestaAsignacionesFlota = {
  datos?: AsignacionContratoFlotaApi[];
};

export type AsignacionContratoFlota = {
  activoId: number;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  contratoCodigo: string | null;
  contratoNombre: string | null;
};

function parsearIdActivo(asignacion: AsignacionContratoFlotaApi) {
  // Contrato temporal con BC-04: hoy viene `unidadId`, luego cambiara a
  // `activoId`. Soportamos ambos para que el cambio futuro sea transparente.
  const raw = asignacion.activoId ?? asignacion.unidadId;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function obtenerAsignacionesContratosFlota(): Promise<
  Map<number, AsignacionContratoFlota>
> {
  try {
    const data = await obtenerAsignacionesContratosActivos();

    const mapa = new Map<number, AsignacionContratoFlota>();

    for (const asignacion of data.datos ?? []) {
      if (asignacion.estadoRegistro && asignacion.estadoRegistro !== "ACTIVO") {
        continue;
      }

      const activoId = parsearIdActivo(asignacion);
      if (!activoId) continue;

      mapa.set(activoId, {
        activoId,
        cuentaCodigo: asignacion.cuenta?.codigo ?? null,
        cuentaNombre: asignacion.cuenta?.nombre ?? null,
        contratoCodigo: asignacion.contrato?.codigo ?? null,
        contratoNombre: asignacion.contrato?.nombre ?? null,
      });
    }

    return mapa;
  } catch {
    return new Map();
  }
}

async function obtenerAsignacionesContratosActivos() {
  try {
    const { data } = await clienteFlota.get<RespuestaAsignacionesFlota>(
      "/flota/asignaciones-contratos/activos",
      { params: { limite: 500 } }
    );
    return data;
  } catch {
    const { data } = await clienteFlota.get<RespuestaAsignacionesFlota>(
      "/flota/asignaciones-contratos",
      { params: { limite: 500 } }
    );
    return data;
  }
}
