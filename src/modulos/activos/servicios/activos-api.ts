import { clienteActivos } from "@/compartido/api/clientes-backend";

import type {
  Activo,
  ActivoConfiguracionHistorica,
  ActivoHistorial,
  ActualizarDetalleInventarioFisicoPayload,
  ActualizarActivoPayload,
  CarroceriaReferencia,
  CerrarInventarioFisicoPayload,
  CrearConfiguracionHistoricaPayload,
  CrearActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearInventarioFisicoPayload,
  CrearTanqueActivoPayload,
  DocumentoActivo,
  EstadoActivo,
  EstadoRegistro,
  ImagenActivo,
  InventarioFisico,
  PlantillaInventario,
  RegistrarRevisionInventarioFisicoPayload,
  SnapshotHistoricoActivoInventario,
  TanqueActivo,
} from "../tipos/activo.tipos";

const CARROCERIAS_REFERENCIA_FALLBACK: CarroceriaReferencia[] = [
  {
    id: -1,
    plantillaInventario: "EQUIPO_LIVIANO",
    nombre: "PICKUP DOBLE CABINA",
    descripcion: "Camioneta pickup para personal y carga ligera.",
    anchoSugerido: 1.85,
    longitudSugerida: 5.3,
    altoSugerido: 1.82,
    ejesSugeridos: 2,
    categoriaSugerida: "N1",
    activo: true,
  },
  {
    id: -2,
    plantillaInventario: "EQUIPO_LIVIANO",
    nombre: "PICKUP CABINA SIMPLE",
    descripcion: "Pickup con mayor espacio de carga.",
    anchoSugerido: 1.85,
    longitudSugerida: 5.25,
    altoSugerido: 1.8,
    ejesSugeridos: 2,
    categoriaSugerida: "N1",
    activo: true,
  },
  {
    id: -3,
    plantillaInventario: "EQUIPO_LIVIANO",
    nombre: "SUV / STATION WAGON",
    descripcion: "Unidad para transporte de personal.",
    anchoSugerido: 1.9,
    longitudSugerida: 4.8,
    altoSugerido: 1.75,
    ejesSugeridos: 2,
    categoriaSugerida: "M1",
    activo: true,
  },
  {
    id: -4,
    plantillaInventario: "CAMION",
    nombre: "PLATAFORMA",
    descripcion: "Camion rigido para carga general.",
    anchoSugerido: 2.5,
    longitudSugerida: 8.5,
    altoSugerido: 3,
    ejesSugeridos: 2,
    categoriaSugerida: "N2",
    activo: true,
  },
  {
    id: -5,
    plantillaInventario: "CAMION",
    nombre: "FURGON CERRADO",
    descripcion: "Camion para carga protegida.",
    anchoSugerido: 2.55,
    longitudSugerida: 9,
    altoSugerido: 3.6,
    ejesSugeridos: 2,
    categoriaSugerida: "N2",
    activo: true,
  },
  {
    id: -6,
    plantillaInventario: "REMOLCADOR",
    nombre: "TRACTO 4X2",
    descripcion: "Remolcador para semirremolque liviano o medio.",
    anchoSugerido: 2.55,
    longitudSugerida: 6.2,
    altoSugerido: 3.6,
    ejesSugeridos: 2,
    categoriaSugerida: "N3",
    activo: true,
  },
  {
    id: -7,
    plantillaInventario: "REMOLCADOR",
    nombre: "TRACTO 6X4",
    descripcion: "Remolcador para carga pesada.",
    anchoSugerido: 2.55,
    longitudSugerida: 7.2,
    altoSugerido: 3.8,
    ejesSugeridos: 3,
    categoriaSugerida: "N3",
    activo: true,
  },
  {
    id: -8,
    plantillaInventario: "SEMIREMOLQUE",
    nombre: "PLATAFORMA",
    descripcion: "Semirremolque para carga general.",
    anchoSugerido: 2.55,
    longitudSugerida: 13.5,
    altoSugerido: 1.5,
    ejesSugeridos: 3,
    categoriaSugerida: "O4",
    activo: true,
  },
  {
    id: -9,
    plantillaInventario: "SEMIREMOLQUE",
    nombre: "CISTERNA",
    descripcion: "Semirremolque para liquidos.",
    anchoSugerido: 2.55,
    longitudSugerida: 12.5,
    altoSugerido: 3.9,
    ejesSugeridos: 3,
    categoriaSugerida: "O4",
    activo: true,
  },
];

type ObtenerActivosParams = {
  estadoRegistro?: EstadoRegistro | "TODOS";
};

export async function obtenerActivos(
  params?: ObtenerActivosParams
): Promise<Activo[]> {
  if (params?.estadoRegistro === "TODOS") {
    const [activos, anulados] = await Promise.all([
      obtenerActivos({ estadoRegistro: true }),
      obtenerActivos({ estadoRegistro: false }),
    ]);

    return [...activos, ...anulados];
  }

  const queryParams =
    params?.estadoRegistro === undefined
      ? undefined
      : { estadoRegistro: params.estadoRegistro };
  const { data } = await clienteActivos.get<unknown>("/activos", {
    params: queryParams,
  });

  if (Array.isArray(data)) {
    return data as Activo[];
  }

  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { activos?: unknown }).activos)
  ) {
    return (data as { activos: Activo[] }).activos;
  }

  throw new Error(
    "La API de activos no devolvio una lista. Revisa NEXT_PUBLIC_ACTIVOS_API_URL."
  );
}

export async function obtenerActivoPorCodigo(codigo: string): Promise<Activo> {
  const { data } = await clienteActivos.get<Activo>(
    `/activos/codigo/${codigo}`
  );
  return data;
}

export async function obtenerActivoPorId(id: number): Promise<Activo> {
  const { data } = await clienteActivos.get<Activo>(`/activos/${id}`);
  return data;
}

export async function obtenerHistorialPorCodigo(
  codigo: string
): Promise<ActivoHistorial[]> {
  const { data } = await clienteActivos.get<ActivoHistorial[]>(
    `/activos/codigo/${codigo}/historial`
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerConfiguracionHistoricaPorCodigo(
  codigo: string
): Promise<ActivoConfiguracionHistorica[]> {
  const { data } = await clienteActivos.get<ActivoConfiguracionHistorica[]>(
    `/activos/codigo/${codigo}/configuracion-historica`
  );
  return Array.isArray(data) ? data : [];
}

export async function registrarConfiguracionHistoricaPorCodigo(
  codigo: string,
  payload: CrearConfiguracionHistoricaPayload
): Promise<ActivoConfiguracionHistorica> {
  const { data } = await clienteActivos.post<ActivoConfiguracionHistorica>(
    `/activos/codigo/${codigo}/configuracion-historica`,
    payload
  );
  return data;
}

export async function obtenerCarroceriasReferencia(
  plantillaInventario?: PlantillaInventario
): Promise<CarroceriaReferencia[]> {
  const params = plantillaInventario ? { plantillaInventario } : undefined;
  try {
    const { data } = await clienteActivos.get<CarroceriaReferencia[]>(
      "/activos/carrocerias-referencia",
      { params }
    );
    const referencias = Array.isArray(data) ? data : [];
    const filtradas = plantillaInventario
      ? referencias.filter(
          (referencia) =>
            referencia.plantillaInventario === plantillaInventario
        )
      : referencias;

    return filtradas.length
      ? filtradas
      : obtenerCarroceriasFallback(plantillaInventario);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("No se pudo cargar carrocerias desde API", error);
    }
    return obtenerCarroceriasFallback(plantillaInventario);
  }
}

function obtenerCarroceriasFallback(plantillaInventario?: PlantillaInventario) {
  return plantillaInventario
    ? CARROCERIAS_REFERENCIA_FALLBACK.filter(
        (referencia) => referencia.plantillaInventario === plantillaInventario
      )
    : CARROCERIAS_REFERENCIA_FALLBACK;
}

export async function crearActivo(payload: CrearActivoPayload): Promise<Activo> {
  const { data } = await clienteActivos.post<Activo>("/activos", payload);
  return data;
}

export async function actualizarActivo(
  id: number,
  payload: ActualizarActivoPayload
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(`/activos/${id}`, payload);
  return data;
}

export async function cambiarEstadoActivo(
  id: number,
  payload: {
    estadoActivo: EstadoActivo;
    motivo?: string;
    usuario?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/estado-activo`,
    payload
  );
  return data;
}

export async function cambiarEstadoRegistro(
  id: number,
  payload: {
    estadoRegistro: EstadoRegistro;
    motivo?: string;
    usuario?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/estado-registro`,
    payload
  );
  return data;
}

export async function siniestrarActivo(
  id: number,
  payload: {
    observacion?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/siniestrar`,
    payload
  );
  return data;
}

export async function obtenerImagenesPorCodigo(
  codigo: string
): Promise<ImagenActivo[]> {
  const { data } = await clienteActivos.get<ImagenActivo[]>(
    `/activos/codigo/${codigo}/imagenes`
  );
  return data;
}

export async function crearImagenPorCodigo(
  codigo: string,
  payload: CrearImagenActivoPayload
): Promise<ImagenActivo> {
  const { data } = await clienteActivos.post<ImagenActivo>(
    `/activos/codigo/${codigo}/imagenes`,
    payload
  );
  return data;
}

export async function eliminarImagenPorCodigo(
  codigo: string,
  imagenId: number
): Promise<void> {
  await clienteActivos.delete(`/activos/codigo/${codigo}/imagenes/${imagenId}`);
}

export async function obtenerDocumentosPorCodigo(
  codigo: string
): Promise<DocumentoActivo[]> {
  const { data } = await clienteActivos.get<DocumentoActivo[]>(
    `/activos/codigo/${codigo}/documentos`
  );
  return data;
}

export async function obtenerDocumentosPorActivoId(
  id: number
): Promise<DocumentoActivo[]> {
  const { data } = await clienteActivos.get<DocumentoActivo[]>(
    `/activos/${id}/documentos`
  );
  return Array.isArray(data) ? data : [];
}

export async function crearDocumentoPorCodigo(
  codigo: string,
  payload: CrearDocumentoActivoPayload
): Promise<DocumentoActivo> {
  const { data } = await clienteActivos.post<DocumentoActivo>(
    `/activos/codigo/${codigo}/documentos`,
    payload
  );
  return data;
}

export async function eliminarDocumentoPorCodigo(
  codigo: string,
  documentoId: number
): Promise<void> {
  await clienteActivos.delete(
    `/activos/codigo/${codigo}/documentos/${documentoId}`
  );
}

export async function obtenerTanquesPorCodigo(
  codigo: string
): Promise<TanqueActivo[]> {
  const { data } = await clienteActivos.get<TanqueActivo[]>(
    `/activos/codigo/${codigo}/tanques`
  );
  return data;
}

export async function crearTanquePorCodigo(
  codigo: string,
  payload: CrearTanqueActivoPayload
): Promise<TanqueActivo> {
  const { data } = await clienteActivos.post<TanqueActivo>(
    `/activos/codigo/${codigo}/tanques`,
    payload
  );
  return data;
}

export async function eliminarTanquePorCodigo(
  codigo: string,
  tanqueId: number
): Promise<void> {
  await clienteActivos.delete(`/activos/codigo/${codigo}/tanques/${tanqueId}`);
}

export async function obtenerInventariosFisicos(): Promise<InventarioFisico[]> {
  const { data } = await clienteActivos.get<unknown>(
    "/activos/inventarios-fisicos"
  );

  if (Array.isArray(data)) {
    return data as InventarioFisico[];
  }

  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { inventarios?: unknown }).inventarios)
  ) {
    return (data as { inventarios: InventarioFisico[] }).inventarios;
  }

  throw new Error("La API de inventario fisico no devolvio una lista.");
}

export async function obtenerInventarioFisicoPorId(
  id: number
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.get<InventarioFisico>(
    `/activos/inventarios-fisicos/${id}`
  );
  return data;
}

export async function obtenerSnapshotsHistoricosActivoInventario(
  activoId: number,
  excludeInventarioId?: number
): Promise<SnapshotHistoricoActivoInventario[]> {
  const query =
    excludeInventarioId !== undefined
      ? `?excludeInventarioId=${encodeURIComponent(excludeInventarioId)}`
      : "";
  const { data } = await clienteActivos.get<
    SnapshotHistoricoActivoInventario[]
  >(`/activos/inventarios-fisicos/activos/${activoId}/snapshots${query}`);
  return data;
}

export async function aperturarInventarioFisico(
  payload: CrearInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.post<InventarioFisico>(
    "/activos/inventarios-fisicos",
    payload
  );
  return data;
}

export async function actualizarDetalleInventarioFisico(
  inventarioId: number,
  detalleId: number,
  payload: ActualizarDetalleInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.patch<InventarioFisico>(
    `/activos/inventarios-fisicos/${inventarioId}/detalles/${detalleId}`,
    payload
  );
  return data;
}

export async function registrarRevisionInventarioFisico(
  inventarioId: number,
  payload: RegistrarRevisionInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.post<InventarioFisico>(
    `/activos/inventarios-fisicos/${inventarioId}/revisiones`,
    payload
  );
  return data;
}

export async function cerrarInventarioFisico(
  id: number,
  payload: CerrarInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.patch<InventarioFisico>(
    `/activos/inventarios-fisicos/${id}/cerrar`,
    payload
  );
  return data;
}
